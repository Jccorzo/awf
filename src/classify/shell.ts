// A small shell parser: enough to split what coding agents run into simple commands.
// It doesn't evaluate anything. Unusual syntax degrades to words, never to an exception.

export interface SimpleCommand {
  /** Words with quotes removed; redirections, keywords and leading VAR=value taken out. */
  argv: string[];
  /** Files the command's output is redirected to (not /dev/*, descriptors or temp folders). */
  writes: string[];
  /** `cd` targets run before this command in the same line, in order. */
  cd: string[];
  /** Downstream of a pipe: a filter like `| tail`, which only decides the phase if it's a check. */
  piped: boolean;
  /** The operator after it (`&&`, `||`, `;`, `|`, `&`, a newline), undefined at the end. */
  next?: string;
  /** Inside parentheses: its `cd` doesn't outlive the subshell. */
  subshell?: boolean;
  /** From a `$(...)`, backtick or `<(...)` substitution inside another command. */
  substituted?: boolean;
  /**
   * Run through a function that pipes it or follows it with `||` (`q() { "$@" | tail; }`): its
   * exit code isn't what the line ends with.
   */
  hidden?: boolean;
}

type Token =
  | { kind: 'word'; value: string; quoted: boolean; subs?: string[] }
  | { kind: 'op'; value: string }
  | { kind: 'redirect'; value: string };

const OPERATORS = ['&&', '||', '|&', ';;', ';', '|', '&', '\n', '(', ')'];
const REDIRECT_OP = /^(>>|>\||>&|>|<<<|<<-|<<|<>|<&|<)/;
const TEMP = /^(\/tmp\/|\/private\/tmp\/|\/var\/folders\/|\$TMPDIR|\$\{TMPDIR\})/;

/** Heredoc tags opened on one line, given the quoting carried in from earlier lines (updated). */
function heredocTags(line: string, stack: string[]): string[] {
  const tags: string[] = [];
  const top = () => stack[stack.length - 1] ?? 'top';
  for (let i = 0; i < line.length; i++) {
    const c = line[i] as string;
    const context = top();
    if (context === 'sq') {
      if (c === "'") stack.pop();
      continue;
    }
    if (c === '\\') {
      i++;
      continue;
    }
    if (context === 'dq') {
      if (c === '"') stack.pop();
      else if (c === '$' && line[i + 1] === '(') {
        stack.push(line[i + 2] === '(' ? 'arith' : 'cmd');
        i += line[i + 2] === '(' ? 2 : 1;
      }
      continue;
    }
    if (context === 'arith') {
      if (c === ')' && line[i + 1] === ')') {
        stack.pop();
        i++;
      }
      continue;
    }
    // top, cmd or a subshell: quotes, substitutions, heredocs and comments are live here.
    if (c === '#' && (i === 0 || /[\s;&|(]/.test(line[i - 1] ?? ''))) break; // `# it's`
    if (c === "'") stack.push('sq');
    else if (c === '"') stack.push('dq');
    else if (c === '$' && line[i + 1] === '(') {
      stack.push(line[i + 2] === '(' ? 'arith' : 'cmd');
      i += line[i + 2] === '(' ? 2 : 1;
    } else if (c === '(') stack.push('paren');
    else if (c === ')' && (context === 'cmd' || context === 'paren')) stack.pop();
    else if (c === '<' && line[i + 1] === '<') {
      if (line[i + 2] === '<') {
        i += 2; // a here-string, not a heredoc
        continue;
      }
      const match = /^<<-?\s*(?:'([^']+)'|"([^"]+)"|\\?([A-Za-z_][A-Za-z0-9_]*))/.exec(
        line.slice(i),
      );
      const tag = match?.[1] ?? match?.[2] ?? match?.[3];
      if (match && tag) {
        tags.push(tag);
        i += match[0].length - 1;
      } else i++;
    }
  }
  return tags;
}

/** Removes heredoc bodies and their terminator lines, keeping the line that opens them. */
export function stripHeredocs(text: string): string {
  if (!text.includes('<<')) return text;
  const lines = text.split('\n');
  const out: string[] = [];
  const stack: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    out.push(line);
    for (const tag of heredocTags(line, stack)) {
      while (i + 1 < lines.length && (lines[i + 1] ?? '').trim() !== tag) i++;
      if (i + 1 < lines.length) i++;
    }
  }
  return out.join('\n');
}

/** The commands inside `$(...)` and backticks in a double-quoted string's text. */
function substitutionsIn(text: string): string[] {
  const subs: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '\\') i++;
    else if (c === '$' && text[i + 1] === '(' && text[i + 2] !== '(') {
      const end = closingParen(text, i + 1);
      subs.push(text.slice(i + 2, end));
      i = end;
    } else if (c === '`') {
      const end = text.indexOf('`', i + 1);
      const stop = end === -1 ? text.length : end;
      subs.push(text.slice(i + 1, stop));
      i = stop;
    }
  }
  return subs;
}

/** Splits text into words, operators and redirections, honouring quotes, escapes and $(...). */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let word = '';
  let quoted = false;
  let inWord = false;
  let subs: string[] = [];
  const flush = () => {
    if (inWord)
      tokens.push({ kind: 'word', value: word, quoted, ...(subs.length ? { subs } : {}) });
    word = '';
    quoted = false;
    inWord = false;
    subs = [];
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i] as string;
    if (c === '\\') {
      if (text[i + 1] !== '\n') {
        word += text[i + 1] ?? '';
        inWord = true;
      }
      i++;
      continue;
    }
    if (c === "'") {
      const end = text.indexOf("'", i + 1);
      const stop = end === -1 ? text.length : end;
      word += text.slice(i + 1, stop);
      quoted = inWord = true;
      i = stop;
      continue;
    }
    if (c === '"') {
      const j = closingQuote(text, i);
      const inside = text.slice(i + 1, j);
      word += inside.replace(/\\(["\\$`])/g, '$1');
      subs.push(...substitutionsIn(inside));
      quoted = inWord = true;
      i = j;
      continue;
    }
    if (c === '$' && text[i + 1] === '(') {
      const end = closingParen(text, i + 1);
      word += text.slice(i, end + 1);
      if (text[i + 2] !== '(') subs.push(text.slice(i + 2, end));
      inWord = true;
      i = end;
      continue;
    }
    if (c === '$' && text[i + 1] === '{') {
      // ${p%% *}: a parameter expansion is one word, spaces and all.
      const end = closingBrace(text, i + 1);
      word += text.slice(i, end + 1);
      inWord = true;
      i = end;
      continue;
    }
    if (c === '`') {
      const end = text.indexOf('`', i + 1);
      const stop = end === -1 ? text.length : end;
      word += text.slice(i, stop + 1);
      subs.push(text.slice(i + 1, stop));
      inWord = true;
      i = stop;
      continue;
    }
    if ((c === '<' || c === '>') && text[i + 1] === '(') {
      // Process substitution, <(cmd) or >(cmd): one word, and a command of its own.
      const end = closingParen(text, i + 1);
      word += text.slice(i, end + 1);
      subs.push(text.slice(i + 2, end));
      inWord = true;
      i = end;
      continue;
    }
    if (c === '#' && !inWord) {
      while (i + 1 < text.length && text[i + 1] !== '\n') i++;
      continue;
    }
    if (c === ' ' || c === '\t' || c === '\r') {
      flush();
      continue;
    }
    if (c === '>' || c === '<' || (c === '&' && text[i + 1] === '>')) {
      let fd = '';
      if (inWord && /^\d+$/.test(word)) {
        fd = word;
        word = '';
        inWord = false;
      } else {
        flush();
      }
      let j = i;
      let op = '';
      if (text[j] === '&') {
        op = '&';
        j++;
      }
      const match = REDIRECT_OP.exec(text.slice(j));
      const symbol = match?.[1] ?? (text[j] as string);
      tokens.push({ kind: 'redirect', value: fd + op + symbol });
      i = j + symbol.length - 1;
      continue;
    }
    const operator = OPERATORS.find((o) => text.startsWith(o, i));
    if (operator) {
      flush();
      tokens.push({ kind: 'op', value: operator });
      i += operator.length - 1;
      continue;
    }
    word += c;
    inWord = true;
  }
  flush();
  return tokens;
}

/** Index of the `"` closing the string opened at `open`; `$(...)` inside starts its own quoting. */
function closingQuote(text: string, open: number): number {
  let j = open + 1;
  while (j < text.length) {
    const c = text[j];
    if (c === '\\') j += 2;
    else if (c === '"') return j;
    else if (c === '$' && text[j + 1] === '(') j = closingParen(text, j + 1) + 1;
    else if (c === '`') {
      const end = text.indexOf('`', j + 1);
      j = end === -1 ? text.length : end + 1;
    } else j++;
  }
  return text.length;
}

/** Index of the `}` closing the `{` at `open`, skipping quoted text. */
function closingBrace(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === '\\') i++;
    else if (c === "'") {
      const end = text.indexOf("'", i + 1);
      i = end === -1 ? text.length : end;
    } else if (c === '"') i = closingQuote(text, i);
    else if (c === '\n') return i - 1;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return i;
  }
  return text.length - 1;
}

/** Index of the `)` closing the `(` at `open`, skipping quoted text and nested substitutions. */
function closingParen(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === '\\') i++;
    else if (c === "'") {
      const end = text.indexOf("'", i + 1);
      i = end === -1 ? text.length : end;
    } else if (c === '"') i = closingQuote(text, i);
    else if (c === '(') depth++;
    else if (c === ')' && --depth === 0) return i;
  }
  return text.length - 1;
}

const LEADING_KEYWORDS = new Set([
  '!',
  '{',
  '}',
  'then',
  'do',
  'else',
  'elif',
  'if',
  'while',
  'until',
]);
const SKIPPED_HEADS = new Set(['fi', 'done', 'esac', 'for', 'select', 'case', 'function']);
const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*(\[[^\]]*\])?\+?=/;

/** What one command line defines for the rest of it, substitutions included. */
interface Scope {
  /** Functions defined in it: calling one runs its body, which is counted where it's defined. */
  functions: Set<string>;
  /**
   * Functions whose body runs their arguments as a command (`run() { name=$1; shift; "$@" > log; }`),
   * with the number of arguments shifted off first: a call runs the rest (`run lint pnpm lint`).
   */
  forwarders: Map<string, { skip: number; hides: boolean }>;
  /** Variables set to a plain value (`R=./build/app`, `G="git -C ../x"`), for `$R tree`. */
  vars: Map<string, string>;
  /** Arrays set to plain values (`G=(gcloud --project x)`), for `"${G[@]}" run deploy`. */
  arrays: Map<string, string[]>;
  /** Set when the line itself runs its arguments (`exec "$@"` in a script): the arguments skipped. */
  forwards?: number;
  /** Open `{` groups, shared with substitutions, which can't close what they didn't open. */
  braces: number;
  /** Open `if`, `while`, `until`, `for` and `select` blocks: a `shift` inside one may not run. */
  blocks: number;
  /**
   * Function bodies being read, innermost last: a `{` group's depth, or minus the parenthesis
   * depth of a `name() ( ... )` body; the blocks open when it started; the arguments shifted.
   */
  bodies: Array<{ name: string; depth: number; blocks: number; shifts: number }>;
  /** A function defined whose body hasn't opened yet. */
  pending?: { name: string; paren: boolean };
}

const newScope = (): Scope => ({
  functions: new Set(),
  forwarders: new Map(),
  vars: new Map(),
  arrays: new Map(),
  braces: 0,
  blocks: 0,
  bodies: [],
});

/**
 * A command that runs its own arguments: `"$@"`, `$*`, `${@:2}`, `"$1" "${@:2}"`, also behind a
 * wrapper (`exec "$@"`, `env -u X "$@"`, `eval "$@"`). Returns how many arguments it skips.
 */
function forwardOffset(argv: string[]): number | undefined {
  let head = unwrap(argv).argv;
  if (head[0] === 'eval') head = head.slice(1);
  if (/^\$(@|\*|\{@\}|\{\*\}|\{@:-[^}]*\})$/.test(head[0] ?? '')) return 0;
  if (head[0] === '$1' && /^\$\{@:2\}$/.test(head[1] ?? '')) return 0;
  const sliced = /^\$\{@:(\d+)\}$/.exec(head[0] ?? '');
  return sliced ? Math.max(0, Number(sliced[1]) - 1) : undefined;
}

/**
 * Notes the braces and blocks a command's leading words open and close (`{`, `}`, `if`, `while`,
 * `done }`), opening a pending function's body at its `{`.
 */
function trackBlocks(words: Word[], scope: Scope): void {
  for (const word of words) {
    if (word.quoted) return;
    const value = word.value;
    if (value === '{') {
      scope.braces++;
      if (scope.pending && !scope.pending.paren) {
        const { name } = scope.pending;
        scope.bodies.push({ name, depth: scope.braces, blocks: scope.blocks, shifts: 0 });
      }
      scope.pending = undefined;
    } else if (value === '}') {
      if (scope.bodies.at(-1)?.depth === scope.braces) scope.bodies.pop();
      scope.braces = Math.max(0, scope.braces - 1);
    } else if (value === 'if' || value === 'while' || value === 'until') {
      scope.blocks++;
    } else if (value === 'fi' || value === 'done') {
      scope.blocks = Math.max(0, scope.blocks - 1);
    } else if (value === 'for' || value === 'select') {
      scope.blocks++;
      return;
    } else if (!LEADING_KEYWORDS.has(value) && value !== 'esac') {
      return;
    }
  }
}

/**
 * How many leading arguments a shell script skips before running the rest as a command
 * (`exec "$@"`, or `shift; "$@"`), or undefined when it doesn't run its arguments.
 */
export function scriptForwards(text: string): number | undefined {
  const scope = newScope();
  splitCommand(text, 0, scope);
  return scope.forwards;
}

type Word = { value: string; quoted: boolean; subs?: string[]; array?: string[] };

const VAR_HEAD = /^\$(?:\{([A-Za-z_][A-Za-z0-9_]*)\}|([A-Za-z_][A-Za-z0-9_]*))$/;
const ARRAY_REF = /^\$\{([A-Za-z_][A-Za-z0-9_]*)\[[@*]\]\}$/;
const VAR_REF = /\$(?:\{([A-Za-z_][A-Za-z0-9_]*)\}|([A-Za-z_][A-Za-z0-9_]*))/g;
const DECLARES = new Set(['export', 'local', 'declare', 'typeset', 'readonly']);

/** Index of the first word that isn't a leading keyword like `then` or `do`. */
function firstWord(words: Word[]): number {
  let i = 0;
  while (i < words.length && !words[i]?.quoted && LEADING_KEYWORDS.has(words[i]?.value ?? '')) i++;
  return i;
}

/**
 * Notes `NAME=value` set on a line of its own (or by export), and expands a command whose program
 * is such a variable: `G="git -C ../x"; $G status` runs git. A value from a command substitution
 * isn't known, and neither is an assignment in front of a command (`A=1 cmd` sets it for cmd only).
 */
function expandVariables(words: Word[], scope: Scope): Word[] {
  let i = firstWord(words);
  const assignments: Word[] = [];
  if (words[i]?.value && DECLARES.has(words[i]?.value as string) && !words[i]?.quoted) {
    assignments.push(...words.slice(i + 1).filter((w) => ASSIGNMENT.test(w.value)));
    i = words.length;
  }
  while (i < words.length && ASSIGNMENT.test(words[i]?.value ?? ''))
    assignments.push(words[i++] as Word);
  if (i >= words.length) {
    for (const word of assignments) {
      const at = word.value.indexOf('=');
      const name = word.value.slice(0, at).replace(/\+$/, '');
      const value = word.value.slice(at + 1);
      // A command substitution's output isn't known; variables in the value are expanded if known.
      if (word.array && !word.subs?.length && !word.value.includes('+=')) {
        scope.arrays.set(
          name,
          word.array.map((v) =>
            v.replace(VAR_REF, (ref, a, b) => scope.vars.get((a ?? b) as string) ?? ref),
          ),
        );
        scope.vars.delete(name);
      } else if (word.subs?.length || /`|\$\(/.test(value) || word.array) {
        scope.vars.delete(name);
        scope.arrays.delete(name);
      } else
        scope.vars.set(
          name,
          value.replace(VAR_REF, (ref, a, b) => scope.vars.get((a ?? b) as string) ?? ref),
        );
    }
    return words;
  }
  // The program, and any later word that is a whole variable: after a wrapper it can be the
  // program too (`caffeinate -i $G pnpm test`).
  return [
    ...words.slice(0, i),
    ...words.slice(i).flatMap((word) => {
      const array = ARRAY_REF.exec(word.value);
      const values = array ? scope.arrays.get(array[1] as string) : undefined;
      if (values) return values.map((v) => ({ value: v, quoted: true }));
      const match = VAR_HEAD.exec(word.value);
      const value = match ? scope.vars.get((match[1] ?? match[2]) as string) : undefined;
      if (value === undefined || !value.trim()) return [word];
      // Unquoted, the value splits into words; quoted ("$CHROME"), it stays one.
      return (word.quoted ? [value] : value.split(/\s+/).filter(Boolean)).map((v) => ({
        value: v,
        quoted: true,
      }));
    }),
  ];
}

/**
 * Splits a command line into simple commands, in order. `case` patterns are skipped, and calls of
 * functions defined in the same line are dropped: their bodies are counted where they are defined.
 */
export function splitCommand(text: string, depth = 0, scope: Scope = newScope()): SimpleCommand[] {
  const commands: SimpleCommand[] = [];
  let words: Word[] = [];
  let writes: string[] = [];
  let piped = false;
  let redirect: string | null = null;
  const cd: string[] = [];
  /** cd's length at each open parenthesis: a subshell's cd ends with it. */
  const scopes: number[] = [];
  const functions = scope.functions;
  let caseDepth = 0;
  let inPattern = false;
  /** Arguments shifted off outside any function: a script's own. */
  let shifts = 0;
  /** The command before, when it was a test (`[ "$1" = -q ] && shift`): a shift after it may not run. */
  let afterTest = false;

  const end = (operator: string | null) => {
    // `time { ...; }` times a group, whose commands come next.
    const timed = firstWord(words);
    if (words[timed]?.value === 'time' && !words[timed]?.quoted) {
      let j = timed + 1;
      while (words[j]?.value.startsWith('-') && !words[j]?.quoted) j++;
      if (words[j]?.value === '{' && !words[j]?.quoted) words.splice(timed, j - timed);
    }
    // `function name { body`: the body's first command shares the line with the definition.
    const head = firstWord(words);
    if (words[head]?.value === 'function' && words[head + 1] && words[head + 2]?.value === '{') {
      const name = (words[head + 1] as Word).value.replace(/\(\)$/, '');
      functions.add(name);
      trackBlocks(words.slice(0, head), scope);
      scope.braces++;
      scope.bodies.push({ name, depth: scope.braces, blocks: scope.blocks, shifts: 0 });
      words = words.slice(head + 3);
    }
    if (words[firstWord(words)]?.value === 'function' && words[firstWord(words) + 1]) {
      const name = (words[firstWord(words) + 1] as Word).value.replace(/\(\)$/, '');
      scope.pending = { name, paren: false };
      functions.add(name);
    }
    trackBlocks(words, scope);
    words = expandVariables(words, scope);
    let argv = clean(words);
    let hidden = false;
    // A call of a function that runs its arguments runs them: `run lint pnpm lint` is
    // `pnpm lint`, behind a wrapper too (`time run lint pnpm lint`).
    const called = unwrap(argv).argv;
    const forwarder = called[0] !== undefined ? scope.forwarders.get(called[0]) : undefined;
    if (forwarder) {
      const outer = argv.slice(argv.length - called.length)[0] === called[0];
      argv = [
        ...(outer ? argv.slice(0, argv.length - called.length) : []),
        ...called.slice(1 + forwarder.skip),
      ];
      hidden = forwarder.hides;
    }
    const body = scope.bodies.at(-1);
    if (argv[0] === 'shift') {
      // A shift that may not run (after a test, in a case branch, an if or a loop) isn't counted.
      const sure = !afterTest && caseDepth === 0 && scope.blocks <= (body?.blocks ?? 0);
      if (sure && body) body.shifts += Number(argv[1] ?? 1) || 1;
      else if (sure) shifts += Number(argv[1] ?? 1) || 1;
    }
    const forward = forwardOffset(argv);
    if (forward !== undefined) {
      // Counted where it's called, with the call's arguments; outside a function, the line (a
      // script) runs its own.
      const hides = operator === '|' || operator === '|&' || operator === '||';
      if (body) scope.forwarders.set(body.name, { skip: body.shifts + forward, hides });
      else if (depth === 0) scope.forwards = shifts + forward;
      argv.length = 0;
    }
    afterTest =
      ['[', '[[', 'test'].includes(argv[0] ?? '') && (operator === '&&' || operator === '||');
    // `time ( ... )`: time a subshell, whose commands come next.
    if (operator === '(' && argv[0] === 'time' && argv.slice(1).every((a) => a.startsWith('-')))
      argv.length = 0;
    // Substitutions run first, as commands of their own.
    if (depth < 4) {
      for (const sub of words.flatMap((w) => w.subs ?? [])) {
        for (const inner of splitCommand(sub, depth + 1, scope)) {
          commands.push({
            ...inner,
            cd: [...cd, ...inner.cd],
            substituted: true,
            piped: inner.piped,
          });
        }
      }
    }
    if (argv.length > 0 && !functions.has(argv[0] as string)) {
      const command: SimpleCommand = { argv, writes, cd: [...cd], piped };
      if (operator !== null) command.next = operator;
      if (hidden) command.hidden = true;
      if (scopes.length > 0) command.subshell = true;
      commands.push(command);
      if ((argv[0] === 'cd' || argv[0] === 'pushd') && !piped) cd.push(argv[1] ?? '~');
      else if (argv[0] === 'popd' && cd.length > (scopes.at(-1) ?? 0)) cd.pop();
    } else if (operator !== '(' && operator !== ')') {
      // After `)`, the subshell's last command is followed by what follows the subshell.
      const last = commands.at(-1);
      if (last?.next === ')') {
        if (operator === null) delete last.next;
        else last.next = operator;
      }
    }
    words = [];
    writes = [];
    piped = operator === '|' || operator === '|&';
    if (operator === '(') {
      scopes.push(cd.length);
      // `name() ( ... )`: a body in a subshell.
      if (scope.pending?.paren) {
        const { name } = scope.pending;
        scope.bodies.push({ name, depth: -scopes.length, blocks: scope.blocks, shifts: 0 });
        scope.pending = undefined;
      }
    } else if (operator === ')' && scopes.length > 0) {
      if (scope.bodies.at(-1)?.depth === -scopes.length) scope.bodies.pop();
      cd.length = scopes.pop() as number;
    }
  };

  const tokens = tokenize(stripHeredocs(text));
  for (let t = 0; t < tokens.length; t++) {
    const token = tokens[t] as Token;
    if (inPattern) {
      // A case pattern like `a|b)`: skipped up to its closing parenthesis.
      if (token.kind === 'word' && token.value === 'esac') {
        caseDepth--;
        inPattern = false;
      } else if (token.kind === 'op' && token.value === ')') {
        inPattern = false;
      }
      continue;
    }
    if (token.kind === 'word' && token.value === 'esac' && words.length === 0 && caseDepth > 0) {
      caseDepth--;
      continue;
    }
    if (
      token.kind === 'word' &&
      token.value === 'in' &&
      words.length === 2 &&
      words[0]?.value === 'case'
    ) {
      words = [];
      caseDepth++;
      inPattern = true;
      continue;
    }
    if (
      token.kind === 'op' &&
      token.value === '(' &&
      words.length === firstWord(words) + 1 &&
      tokens[t + 1]?.kind === 'op' &&
      tokens[t + 1]?.value === ')'
    ) {
      // `name() { ... }`: a function definition, also after `then`, `else` or `do`, and inside
      // another's body (`outer() { inner() {`): the braces before it count.
      const name = words[words.length - 1]?.value as string;
      trackBlocks(words.slice(0, -1), scope);
      functions.add(name);
      const next = tokens[t + 2];
      scope.pending = { name, paren: next?.kind === 'op' && next.value === '(' };
      words = [];
      t++;
      continue;
    }
    if (redirect !== null) {
      const op = redirect;
      redirect = null;
      if (token.kind === 'word') {
        const toFile = op.includes('>') && !op.endsWith('&') && !op.endsWith('>&');
        const target = token.value;
        if (
          toFile &&
          !target.startsWith('/dev/') &&
          !/^&?\d+$/.test(target) &&
          !TEMP.test(target)
        ) {
          writes.push(target);
        }
        continue;
      }
    }
    if (token.kind === 'redirect') {
      redirect = token.value;
      continue;
    }
    const last = words[words.length - 1];
    if (
      token.kind === 'op' &&
      token.value === '(' &&
      last &&
      !last.quoted &&
      /^[A-Za-z_][A-Za-z0-9_]*\+?=$/.test(last.value)
    ) {
      // `ARGS=(-a "$b")`, `OBJECTS+=("$x")`: an array's values, not a subshell. Substitutions in
      // them still run.
      const subs = [...(last.subs ?? [])];
      const values: string[] = [];
      for (let open = 1; t + 1 < tokens.length && open > 0;) {
        const inner = tokens[++t] as Token;
        if (inner.kind === 'op' && inner.value === '(') open++;
        else if (inner.kind === 'op' && inner.value === ')') open--;
        else if (inner.kind === 'word') {
          subs.push(...(inner.subs ?? []));
          values.push(inner.value);
        }
      }
      last.value += '(…)';
      last.array = values;
      if (subs.length) last.subs = subs;
      continue;
    }
    if (token.kind === 'op') {
      end(token.value);
      if (token.value === ';;' && caseDepth > 0) inPattern = true;
      continue;
    }
    words.push({
      value: token.value,
      quoted: token.quoted,
      ...(token.subs ? { subs: token.subs } : {}),
    });
  }
  end(null);
  return commands;
}

/** Drops keywords, variable assignments before the command, and lines that open control blocks. */
function clean(words: Array<{ value: string; quoted: boolean }>): string[] {
  let start = 0;
  const at = (i: number) => words[i];
  while (
    start < words.length &&
    !at(start)?.quoted &&
    LEADING_KEYWORDS.has(at(start)?.value ?? '')
  ) {
    start++;
  }
  const head = at(start);
  if (head && !head.quoted && SKIPPED_HEADS.has(head.value)) return [];
  // What awf stored in place of a heredoc body (`‹12 lines›`) isn't a command.
  if (/^‹\d+$/.test(head?.value ?? '') && /^lines?›$/.test(at(start + 1)?.value ?? '')) return [];
  // VAR=value, VAR="a b" and VAR=$(cmd) before the command (the name itself is never quoted), and
  // a masked secret (`TOKEN= ‹masked› cmd`): it was a value, never the program.
  while (
    start < words.length &&
    (ASSIGNMENT.test(at(start)?.value ?? '') || at(start)?.value === '‹masked›')
  ) {
    start++;
  }
  return words.slice(start).map((w) => w.value);
}

/** Commands that run another command; options of theirs that take a value. */
const WRAPPERS: Record<
  string,
  { valueOptions?: string[]; positional?: number; stopAt?: string; assignments?: boolean }
> = {
  sudo: { valueOptions: ['-u', '-g', '-C', '-D', '-h', '-p', '-r', '-t', '-U'] },
  doas: { valueOptions: ['-u', '-C'] },
  // `time A=1 cmd`: time is a keyword, and assignments can follow it.
  time: { assignments: true },
  command: {},
  builtin: {},
  exec: { valueOptions: ['-a'] },
  nohup: {},
  nice: { valueOptions: ['-n'] },
  ionice: { valueOptions: ['-c', '-n', '-p'] },
  stdbuf: { valueOptions: ['-i', '-o', '-e'] },
  unbuffer: {},
  caffeinate: { valueOptions: ['-t', '-w'] },
  // macOS: run a command with a QoS clamp or I/O policy, like nice.
  taskpolicy: { valueOptions: ['-c', '-d', '-g', '-t', '-l', '-p'] },
  'xvfb-run': { valueOptions: ['-n', '-s', '-f', '-e', '-p', '-w'] },
  timeout: { valueOptions: ['-s', '-k', '--signal', '--kill-after'], positional: 1 },
  gtimeout: { valueOptions: ['-s', '-k', '--signal', '--kill-after'], positional: 1 },
  watch: { valueOptions: ['-n', '-d', '--interval'] },
  xargs: {
    valueOptions: [
      '-n',
      '-I',
      '-i',
      '-P',
      '-L',
      '-l',
      '-d',
      '-s',
      '-E',
      '-a',
      '--max-args',
      '--max-procs',
      '--delimiter',
      '--arg-file',
    ],
  },
  npx: { valueOptions: ['-p', '--package', '-c', '--call', '--node-options'] },
  pnpx: { valueOptions: ['-p', '--package'] },
  bunx: { valueOptions: ['-p', '--package'] },
  uvx: { valueOptions: ['--from', '--with', '--python', '-p'] },
  'cross-env': { assignments: true },
  'cross-env-shell': { assignments: true },
  dotenv: { valueOptions: ['-e', '-c', '-v'], stopAt: '--' },
  'env-cmd': { valueOptions: ['-f', '-e', '--file', '--environments'] },
  c8: {
    valueOptions: ['--reporter', '-r', '--reports-dir', '-o', '--include', '--exclude', '--src'],
  },
  nyc: {
    valueOptions: ['--reporter', '-r', '--report-dir', '--include', '--exclude', '--extension'],
  },
  chronic: {},
  corepack: {},
  'sandbox-exec': { valueOptions: ['-f', '-n', '-p', '-D'] },
  xcrun: { valueOptions: ['--sdk', '-sdk', '--toolchain', '-toolchain'] },
};

/** Two-word wrappers: `pnpm exec x`, `uv run x`, `bundle exec x`, ...: options of theirs that take a value. */
const WRAPPER_PAIRS: Record<string, Record<string, string[]>> = {
  npm: {
    exec: ['-c', '--call', '-p', '--package', '-w', '--workspace'],
    x: ['-c', '-p', '--package'],
  },
  pnpm: { exec: ['-C', '--dir', '--filter', '-F'], dlx: ['--package', '-p'] },
  yarn: { exec: [], dlx: ['-p', '--package'] },
  bun: { x: ['-p', '--package'] },
  uv: {
    run: [
      '--with',
      '--python',
      '-p',
      '--package',
      '--project',
      '--directory',
      '--extra',
      '--group',
      '--env-file',
      '--with-requirements',
      '--from',
    ],
  },
  poetry: { run: [] },
  pipenv: { run: [] },
  pipx: { run: ['--spec', '--python', '--pip-args'] },
  pdm: { run: [] },
  rye: { run: [] },
  hatch: { run: [] },
  conda: { run: ['-n', '--name', '-p', '--prefix'] },
  mamba: { run: ['-n', '--name', '-p', '--prefix'] },
  bundle: { exec: [] },
  rbenv: { exec: [] },
  pyenv: { exec: [] },
  asdf: { exec: [] },
  mise: { exec: [], x: [] },
  direnv: { exec: [] },
  fnm: { exec: ['--using'] },
  fvm: { exec: [] },
  nvm: { exec: [] },
  volta: { run: ['--node', '--npm', '--yarn', '--pnpm'] },
  op: { run: ['--env-file'] },
  doppler: { run: ['-p', '--project', '-c', '--config'] },
  infisical: { run: ['--env', '--path', '--projectId'] },
};

const GLOBAL_VALUE_OPTIONS: Record<string, string[]> = {
  pnpm: ['-C', '--dir', '--filter', '-F'],
  npm: ['--prefix', '-w', '--workspace'],
  yarn: ['--cwd'],
  uv: ['--directory', '--project'],
  conda: ['-n', '--name'],
  mamba: ['-n', '--name'],
};

const PYTHON = /^(python|python[23](\.\d+)?|py|pypy3?)$/;
const SHELLS = new Set(['sh', 'bash', 'zsh', 'dash', 'ksh']);

/** Scoped packages whose binary has another name. */
const SCOPED: Record<string, string> = {
  '@playwright/test': 'playwright',
  '@angular/cli': 'ng',
  '@biomejs/biome': 'biome',
  '@tailwindcss/cli': 'tailwindcss',
  '@vue/cli-service': 'vue-cli-service',
  '@nestjs/cli': 'nest',
  '@redocly/cli': 'redocly',
  '@stoplight/spectral-cli': 'spectral',
};

/**
 * Program name without its path, extension or pinned version (`prettier@3`, `black==24.8.0`,
 * `@biomejs/biome@latest`); wrapper scripts normalised (gradlew is gradle).
 */
export function programName(word: string): string {
  const scoped = /^(@[\w.-]+\/[\w.-]+)(@[^\s/]+)?$/.exec(word);
  if (scoped?.[1]) return SCOPED[scoped[1]] ?? scoped[1].split('/')[1] ?? scoped[1];
  let name = word.replace(/\\/g, '/').split('/').pop() ?? word;
  name = name.replace(/\.(exe|cmd|bat)$/i, '');
  if (word.includes('/') && /@v?\d[\w.-]*$/.test(name)) name = name.replace(/@v?\d[\w.-]*$/, '');
  name = name.replace(/^([\w.-]+)(@[\w.^~<>=*-]+|==[\w.]+|\[[\w,-]+\])$/, '$1');
  if (name === 'gradlew') return 'gradle';
  if (name === 'mvnw') return 'mvn';
  return name;
}

const PYTHON_FLAGS = new Set([
  '-u',
  '-B',
  '-I',
  '-E',
  '-O',
  '-OO',
  '-s',
  '-S',
  '-q',
  '-b',
  '-bb',
  '-d',
  '-R',
  '-P',
  '-v',
]);
const GO_TOOLS = new Set([
  'addr2line',
  'asm',
  'buildid',
  'cgo',
  'compile',
  'covdata',
  'cover',
  'dist',
  'doc',
  'fix',
  'link',
  'nm',
  'objdump',
  'pack',
  'pprof',
  'preprofile',
  'test2json',
  'trace',
  'vet',
]);

export interface Unwrapped {
  argv: string[];
  /** Wrappers removed, outermost first. */
  wrappers: string[];
}

/** Removes wrappers like `env A=1`, `sudo`, `timeout 60`, `npx`, `uv run`, `python -m` from a command. */
export function unwrap(input: string[]): Unwrapped {
  let argv = [...input];
  const wrappers: string[] = [];
  for (let guard = 0; guard < 8 && argv.length > 0; guard++) {
    const program = programName(argv[0] as string);
    const rest = argv.slice(1);
    if (program === 'env') {
      const after = skipOptions(
        rest,
        ['-u', '--unset', '-C', '--chdir', '-S', '--split-string'],
        true,
      );
      if (after.length === 0) break;
      wrappers.push('env');
      argv = after;
      continue;
    }
    if (PYTHON.test(program)) {
      // python -u -W error -X dev -m pytest
      let i = 0;
      while (i < rest.length) {
        const flag = rest[i] as string;
        if (PYTHON_FLAGS.has(flag)) i++;
        else if (flag === '-W' || flag === '-X') i += 2;
        else break;
      }
      if (rest[i] === '-m' && rest[i + 1]) {
        wrappers.push(`${program} -m`);
        argv = rest.slice(i + 1);
        continue;
      }
    }
    if (program === 'coverage' && rest[0] === 'run') {
      const valueOptions = [
        '--rcfile',
        '--source',
        '--omit',
        '--include',
        '--concurrency',
        '--data-file',
        '--context',
      ];
      let i = 1;
      while (i < rest.length && (rest[i] as string).startsWith('-') && rest[i] !== '-m')
        i += valueOptions.includes(rest[i] as string) ? 2 : 1;
      const after = rest[i] === '-m' ? rest.slice(i + 1) : rest.slice(i);
      if (after.length === 0) break;
      wrappers.push('coverage run');
      argv = rest[i] === '-m' ? after : ['python', ...after];
      continue;
    }
    if (
      program === 'xcrun' &&
      rest.some((a) => /^-(-?find|f|-show-.*|-sdk-.*|-version|v|h|-help)$/.test(a))
    )
      break; // a query: xcrun --show-sdk-path, xcrun --find clang
    if ((program === 'uv' || program === 'dotnet') && rest[0] === 'tool' && rest[1] === 'run') {
      const after = skipOptions(rest.slice(2), ['--from', '--with', '--python', '-p'], false);
      if (after.length === 0) break;
      wrappers.push(`${program} tool run`);
      argv = after;
      continue;
    }
    if (program === 'php' && /(^|\/)(vendor\/)?bin\/[\w.-]+$/.test(rest[0] ?? '')) {
      wrappers.push('php');
      argv = rest;
      continue;
    }
    // fvm runs the project's pinned Flutter SDK: `fvm flutter test`, `fvm dart run`, and
    // `fvm spawn 3.24.0 test`, which runs that version's flutter.
    if (program === 'fvm' && (rest[0] === 'flutter' || rest[0] === 'dart')) {
      wrappers.push('fvm');
      argv = rest;
      continue;
    }
    if (program === 'fvm' && rest[0] === 'spawn' && rest.length > 2) {
      wrappers.push('fvm spawn');
      argv = ['flutter', ...rest.slice(2)];
      continue;
    }
    // `flutter packages` is `flutter pub`, and `flutter pub pub <args>` hands <args> to pub.
    if (
      program === 'flutter' &&
      (rest[0] === 'packages' || (rest[0] === 'pub' && rest[1] === 'pub'))
    ) {
      argv = [argv[0] as string, 'pub', ...rest.slice(rest[1] === 'pub' ? 2 : 1)];
      continue;
    }
    if (program === 'go' && rest[0] === 'tool' && rest[1] && !GO_TOOLS.has(rest[1])) {
      wrappers.push('go tool');
      argv = rest.slice(1);
      continue;
    }
    if (program === 'go' && rest[0] === 'run' && /^[\w.-]+\.[a-z]+\/\S+@\S+$/.test(rest[1] ?? '')) {
      wrappers.push('go run');
      argv = rest.slice(1);
      continue;
    }
    // hushrun runs a check's command unless this exact code already passed it:
    // `hushrun run [NAME] [options] -- COMMAND` is COMMAND. With --stage, it runs a stage's checks.
    if (program === 'hushrun' && rest[0] === 'run' && rest.includes('--')) {
      const after = rest.slice(rest.indexOf('--') + 1);
      if (after.length === 0) break;
      wrappers.push('hushrun run');
      argv = after;
      continue;
    }
    // script(1) runs a command in a terminal it records: BSD's `script -q /dev/null cmd args`,
    // util-linux's `script -q -c "cmd args" /dev/null`.
    if (program === 'script' && argv[0] === 'script') {
      const c = rest.findIndex((a) => a === '-c' || a === '--command');
      if (c >= 0 && rest[c + 1]) {
        wrappers.push('script');
        argv = ['sh', '-c', rest[c + 1] as string];
        continue;
      }
      const after = skipOptions(rest, ['-t', '-T', '-I', '-O', '-B', '-E', '-m'], false).slice(1);
      if (after.length === 0) break;
      wrappers.push('script');
      argv = after;
      continue;
    }
    if (SHELLS.has(program)) break;
    const wrapper = WRAPPERS[program];
    if (wrapper && !(program === 'command' && /^-[vV]$/.test(rest[0] ?? ''))) {
      let after = skipOptions(rest, wrapper.valueOptions ?? [], wrapper.assignments ?? false);
      if (wrapper.stopAt && after[0] === wrapper.stopAt) after = after.slice(1);
      after = after.slice(wrapper.positional ?? 0);
      if (after[0] === '--') after = after.slice(1);
      if (after.length === 0) break;
      wrappers.push(program);
      argv = after;
      continue;
    }
    const pair = WRAPPER_PAIRS[program];
    const sub = pair ? firstPositional(rest, GLOBAL_VALUE_OPTIONS[program] ?? []) : -1;
    const subName = sub >= 0 ? (rest[sub] as string) : undefined;
    const subOptions = pair && subName !== undefined ? pair[subName] : undefined;
    if (subOptions) {
      let after = skipOptions(rest.slice(sub + 1), subOptions, false);
      if (['fnm', 'nvm', 'mise', 'asdf'].includes(program)) {
        // Versions before the command: `nvm exec 20 node`, `mise x node@20 -- node`.
        while (after.length > 1 && /^(\d|[a-z0-9-]+@)/.test(after[0] ?? '')) after = after.slice(1);
      }
      if (after[0] === '--') after = after.slice(1);
      if (program === 'direnv') after = after.slice(1);
      if (after.length === 0) break;
      wrappers.push(`${program} ${subName}`);
      argv = after;
      continue;
    }
    break;
  }
  return { argv, wrappers };
}

/** Skips leading options (and the values of those listed); optionally also VAR=value assignments. */
function skipOptions(args: string[], valueOptions: string[], assignments: boolean): string[] {
  let i = 0;
  while (i < args.length) {
    const arg = args[i] as string;
    if (arg === '--') break;
    // VAR=value, and a masked secret where a value was (`env TOKEN= ‹masked› cmd`).
    if (assignments && (ASSIGNMENT.test(arg) || arg === '‹masked›')) {
      i++;
      continue;
    }
    if (!arg.startsWith('-') || arg === '-') break;
    i += valueOptions.includes(arg) ? 2 : 1;
  }
  return args.slice(i);
}

/** Index of the first argument that isn't an option (or an option's value). */
export function firstPositional(args: string[], valueOptions: string[]): number {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i] as string;
    if (valueOptions.includes(arg)) {
      i++;
      continue;
    }
    if (!arg.startsWith('-')) return i;
  }
  return -1;
}

/** The string passed to `sh -c`, `bash -lc` and friends, if any. */
export function shellString(argv: string[]): string | undefined {
  if (!SHELLS.has(programName(argv[0] ?? ''))) return undefined;
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i] as string;
    if (/^-[a-z]*c[a-z]*$/.test(arg)) return argv[i + 1];
    if (/^[-+][a-zA-Z]*[oO]$/.test(arg)) {
      i++; // -o pipefail, -euo pipefail, +O extglob
      continue;
    }
    if (!arg.startsWith('-') && !arg.startsWith('+')) return undefined;
  }
  return undefined;
}

/** Words joined back into one command line, quoted where the shell would split or expand them. */
export function quoteArgs(args: string[]): string {
  return args
    .map((a) => (/^[\w@%+=:,./-]+$/.test(a) ? a : `'${a.replace(/'/g, `'\\''`)}'`))
    .join(' ');
}

/** A script file a shell runs: `bash x.sh`, `sh ./x.sh`, or `./scripts/x.sh` itself. */
export function scriptFile(argv: string[]): string | undefined {
  const first = argv[0] ?? '';
  if (SHELLS.has(programName(first))) {
    const file = argv.slice(1).find((a) => !a.startsWith('-'));
    return file && !shellString(argv) ? file : undefined;
  }
  // A package's executable (`./node_modules/.bin/vitest`) is the program it names: its shim isn't
  // the project's script.
  if (/(^|\/)node_modules\/\.bin\//.test(first)) return undefined;
  // ./x, scripts/x.sh, script/test, bin/setup: a file the resolver reads, if it's a shell script.
  return /^(\.{0,2}\/|[\w.-]+\/)[^\s]*\.(sh|bash|zsh)$/.test(first) ||
    /^\.\/[\w./-]+$/.test(first) ||
    /^(script|scripts|bin|tools|ci|\.github)\/[\w./-]+$/.test(first)
    ? first
    : undefined;
}
