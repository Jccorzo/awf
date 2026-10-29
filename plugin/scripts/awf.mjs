#!/usr/bin/env node
import { createRequire as __awfCreateRequire } from 'node:module';
const require = __awfCreateRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/identity.js"(exports) {
    "use strict";
    var ALIAS = /* @__PURE__ */ Symbol.for("yaml.alias");
    var DOC = /* @__PURE__ */ Symbol.for("yaml.document");
    var MAP = /* @__PURE__ */ Symbol.for("yaml.map");
    var PAIR = /* @__PURE__ */ Symbol.for("yaml.pair");
    var SCALAR = /* @__PURE__ */ Symbol.for("yaml.scalar");
    var SEQ = /* @__PURE__ */ Symbol.for("yaml.seq");
    var NODE_TYPE = /* @__PURE__ */ Symbol.for("yaml.node.type");
    var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
    var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
    var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
    var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
    var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
    var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
    function isCollection(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case MAP:
          case SEQ:
            return true;
        }
      return false;
    }
    function isNode(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case ALIAS:
          case MAP:
          case SCALAR:
          case SEQ:
            return true;
        }
      return false;
    }
    var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
    exports.ALIAS = ALIAS;
    exports.DOC = DOC;
    exports.MAP = MAP;
    exports.NODE_TYPE = NODE_TYPE;
    exports.PAIR = PAIR;
    exports.SCALAR = SCALAR;
    exports.SEQ = SEQ;
    exports.hasAnchor = hasAnchor;
    exports.isAlias = isAlias;
    exports.isCollection = isCollection;
    exports.isDocument = isDocument;
    exports.isMap = isMap;
    exports.isNode = isNode;
    exports.isPair = isPair;
    exports.isScalar = isScalar;
    exports.isSeq = isSeq;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/visit.js
var require_visit = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/visit.js"(exports) {
    "use strict";
    var identity = require_identity();
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove node");
    function visit(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        visit_(null, node, visitor_, Object.freeze([]));
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    function visit_(key, node, visitor, path14) {
      const ctrl = callVisitor(key, node, visitor, path14);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path14, ctrl);
        return visit_(key, ctrl, visitor, path14);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path14 = Object.freeze(path14.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = visit_(i, node.items[i], visitor, path14);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path14 = Object.freeze(path14.concat(node));
          const ck = visit_("key", node.key, visitor, path14);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = visit_("value", node.value, visitor, path14);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    async function visitAsync(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        await visitAsync_(null, node, visitor_, Object.freeze([]));
    }
    visitAsync.BREAK = BREAK;
    visitAsync.SKIP = SKIP;
    visitAsync.REMOVE = REMOVE;
    async function visitAsync_(key, node, visitor, path14) {
      const ctrl = await callVisitor(key, node, visitor, path14);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path14, ctrl);
        return visitAsync_(key, ctrl, visitor, path14);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path14 = Object.freeze(path14.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = await visitAsync_(i, node.items[i], visitor, path14);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path14 = Object.freeze(path14.concat(node));
          const ck = await visitAsync_("key", node.key, visitor, path14);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = await visitAsync_("value", node.value, visitor, path14);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    function initVisitor(visitor) {
      if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
          Alias: visitor.Node,
          Map: visitor.Node,
          Scalar: visitor.Node,
          Seq: visitor.Node
        }, visitor.Value && {
          Map: visitor.Value,
          Scalar: visitor.Value,
          Seq: visitor.Value
        }, visitor.Collection && {
          Map: visitor.Collection,
          Seq: visitor.Collection
        }, visitor);
      }
      return visitor;
    }
    function callVisitor(key, node, visitor, path14) {
      if (typeof visitor === "function")
        return visitor(key, node, path14);
      if (identity.isMap(node))
        return visitor.Map?.(key, node, path14);
      if (identity.isSeq(node))
        return visitor.Seq?.(key, node, path14);
      if (identity.isPair(node))
        return visitor.Pair?.(key, node, path14);
      if (identity.isScalar(node))
        return visitor.Scalar?.(key, node, path14);
      if (identity.isAlias(node))
        return visitor.Alias?.(key, node, path14);
      return void 0;
    }
    function replaceNode(key, path14, node) {
      const parent = path14[path14.length - 1];
      if (identity.isCollection(parent)) {
        parent.items[key] = node;
      } else if (identity.isPair(parent)) {
        if (key === "key")
          parent.key = node;
        else
          parent.value = node;
      } else if (identity.isDocument(parent)) {
        parent.contents = node;
      } else {
        const pt = identity.isAlias(parent) ? "alias" : "scalar";
        throw new Error(`Cannot replace node with ${pt} parent`);
      }
    }
    exports.visit = visit;
    exports.visitAsync = visitAsync;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/directives.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    var escapeChars = {
      "!": "%21",
      ",": "%2C",
      "[": "%5B",
      "]": "%5D",
      "{": "%7B",
      "}": "%7D"
    };
    var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
    var Directives = class _Directives {
      constructor(yaml, tags) {
        this.docStart = null;
        this.docEnd = false;
        this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
        this.tags = Object.assign({}, _Directives.defaultTags, tags);
      }
      clone() {
        const copy = new _Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
      }
      /**
       * During parsing, get a Directives instance for the current document and
       * update the stream state according to the current version's spec.
       */
      atDocument() {
        const res = new _Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
          case "1.1":
            this.atNextDocument = true;
            break;
          case "1.2":
            this.atNextDocument = false;
            this.yaml = {
              explicit: _Directives.defaultYaml.explicit,
              version: "1.2"
            };
            this.tags = Object.assign({}, _Directives.defaultTags);
            break;
        }
        return res;
      }
      /**
       * @param onError - May be called even if the action was successful
       * @returns `true` on success
       */
      add(line, onError) {
        if (this.atNextDocument) {
          this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
          this.tags = Object.assign({}, _Directives.defaultTags);
          this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name = parts.shift();
        switch (name) {
          case "%TAG": {
            if (parts.length !== 2) {
              onError(0, "%TAG directive should contain exactly two parts");
              if (parts.length < 2)
                return false;
            }
            const [handle, prefix] = parts;
            this.tags[handle] = prefix;
            return true;
          }
          case "%YAML": {
            this.yaml.explicit = true;
            if (parts.length !== 1) {
              onError(0, "%YAML directive should contain exactly one part");
              return false;
            }
            const [version] = parts;
            if (version === "1.1" || version === "1.2") {
              this.yaml.version = version;
              return true;
            } else {
              const isValid = /^\d+\.\d+$/.test(version);
              onError(6, `Unsupported YAML version ${version}`, isValid);
              return false;
            }
          }
          default:
            onError(0, `Unknown directive ${name}`, true);
            return false;
        }
      }
      /**
       * Resolves a tag, matching handles to those defined in %TAG directives.
       *
       * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
       *   `'!local'` tag, or `null` if unresolvable.
       */
      tagName(source, onError) {
        if (source === "!")
          return "!";
        if (source[0] !== "!") {
          onError(`Not a valid tag: ${source}`);
          return null;
        }
        if (source[1] === "<") {
          const verbatim = source.slice(2, -1);
          if (verbatim === "!" || verbatim === "!!") {
            onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
            return null;
          }
          if (source[source.length - 1] !== ">")
            onError("Verbatim tags must end with a >");
          return verbatim;
        }
        const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
          onError(`The ${source} tag has no suffix`);
        const prefix = this.tags[handle];
        if (prefix) {
          try {
            return prefix + decodeURIComponent(suffix);
          } catch (error) {
            onError(String(error));
            return null;
          }
        }
        if (handle === "!")
          return source;
        onError(`Could not resolve tag: ${source}`);
        return null;
      }
      /**
       * Given a fully resolved tag, returns its printable string form,
       * taking into account current tag prefixes and defaults.
       */
      tagString(tag) {
        for (const [handle, prefix] of Object.entries(this.tags)) {
          if (tag.startsWith(prefix))
            return handle + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === "!" ? tag : `!<${tag}>`;
      }
      toString(doc) {
        const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
          const tags = {};
          visit.visit(doc.contents, (_key, node) => {
            if (identity.isNode(node) && node.tag)
              tags[node.tag] = true;
          });
          tagNames = Object.keys(tags);
        } else
          tagNames = [];
        for (const [handle, prefix] of tagEntries) {
          if (handle === "!!" && prefix === "tag:yaml.org,2002:")
            continue;
          if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
            lines.push(`%TAG ${handle} ${prefix}`);
        }
        return lines.join("\n");
      }
    };
    Directives.defaultYaml = { explicit: false, version: "1.2" };
    Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
    exports.Directives = Directives;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/anchors.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    function anchorIsValid(anchor) {
      if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
        const sa = JSON.stringify(anchor);
        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
        throw new Error(msg);
      }
      return true;
    }
    function anchorNames(root) {
      const anchors = /* @__PURE__ */ new Set();
      visit.visit(root, {
        Value(_key, node) {
          if (node.anchor)
            anchors.add(node.anchor);
        }
      });
      return anchors;
    }
    function findNewAnchor(prefix, exclude) {
      for (let i = 1; true; ++i) {
        const name = `${prefix}${i}`;
        if (!exclude.has(name))
          return name;
      }
    }
    function createNodeAnchors(doc, prefix) {
      const aliasObjects = [];
      const sourceObjects = /* @__PURE__ */ new Map();
      let prevAnchors = null;
      return {
        onAnchor: (source) => {
          aliasObjects.push(source);
          prevAnchors ?? (prevAnchors = anchorNames(doc));
          const anchor = findNewAnchor(prefix, prevAnchors);
          prevAnchors.add(anchor);
          return anchor;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
          for (const source of aliasObjects) {
            const ref = sourceObjects.get(source);
            if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
              ref.node.anchor = ref.anchor;
            } else {
              const error = new Error("Failed to resolve repeated object (this should not happen)");
              error.source = source;
              throw error;
            }
          }
        },
        sourceObjects
      };
    }
    exports.anchorIsValid = anchorIsValid;
    exports.anchorNames = anchorNames;
    exports.createNodeAnchors = createNodeAnchors;
    exports.findNewAnchor = findNewAnchor;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/applyReviver.js"(exports) {
    "use strict";
    function applyReviver(reviver, obj2, key, val) {
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          for (let i = 0, len = val.length; i < len; ++i) {
            const v0 = val[i];
            const v1 = applyReviver(reviver, val, String(i), v0);
            if (v1 === void 0)
              delete val[i];
            else if (v1 !== v0)
              val[i] = v1;
          }
        } else if (val instanceof Map) {
          for (const k of Array.from(val.keys())) {
            const v0 = val.get(k);
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              val.delete(k);
            else if (v1 !== v0)
              val.set(k, v1);
          }
        } else if (val instanceof Set) {
          for (const v0 of Array.from(val)) {
            const v1 = applyReviver(reviver, val, v0, v0);
            if (v1 === void 0)
              val.delete(v0);
            else if (v1 !== v0) {
              val.delete(v0);
              val.add(v1);
            }
          }
        } else {
          for (const [k, v0] of Object.entries(val)) {
            const v1 = applyReviver(reviver, val, k, v0);
            if (v1 === void 0)
              delete val[k];
            else if (v1 !== v0)
              val[k] = v1;
          }
        }
      }
      return reviver.call(obj2, key, val);
    }
    exports.applyReviver = applyReviver;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/toJS.js"(exports) {
    "use strict";
    var identity = require_identity();
    function toJS(value, arg, ctx) {
      if (Array.isArray(value))
        return value.map((v, i) => toJS(v, String(i), ctx));
      if (value && typeof value.toJSON === "function") {
        if (!ctx || !identity.hasAnchor(value))
          return value.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: void 0 };
        ctx.anchors.set(value, data);
        ctx.onCreate = (res2) => {
          data.res = res2;
          delete ctx.onCreate;
        };
        const res = value.toJSON(arg, ctx);
        if (ctx.onCreate)
          ctx.onCreate(res);
        return res;
      }
      if (typeof value === "bigint" && !ctx?.keep)
        return Number(value);
      return value;
    }
    exports.toJS = toJS;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Node.js"(exports) {
    "use strict";
    var applyReviver = require_applyReviver();
    var identity = require_identity();
    var toJS = require_toJS();
    var NodeBase = class {
      constructor(type) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: type });
      }
      /** Create a copy of this node.  */
      clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** A plain JavaScript representation of this node. */
      toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        if (!identity.isDocument(doc))
          throw new TypeError("A document argument is required");
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc,
          keep: true,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this, "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
    };
    exports.NodeBase = NodeBase;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Alias.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var visit = require_visit();
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var Alias = class extends Node.NodeBase {
      constructor(source) {
        super(identity.ALIAS);
        this.source = source;
        Object.defineProperty(this, "tag", {
          set() {
            throw new Error("Alias nodes cannot have tags");
          }
        });
      }
      /**
       * Resolve the value of this alias within `doc`, finding the last
       * instance of the `source` anchor before this node.
       */
      resolve(doc, ctx) {
        if (ctx?.maxAliasCount === 0)
          throw new ReferenceError("Alias resolution is disabled");
        let nodes;
        if (ctx?.aliasResolveCache) {
          nodes = ctx.aliasResolveCache;
        } else {
          nodes = [];
          visit.visit(doc, {
            Node: (_key, node) => {
              if (identity.isAlias(node) || identity.hasAnchor(node))
                nodes.push(node);
            }
          });
          if (ctx)
            ctx.aliasResolveCache = nodes;
        }
        let found = void 0;
        for (const node of nodes) {
          if (node === this)
            break;
          if (node.anchor === this.source)
            found = node;
        }
        if (found && ctx) {
          const { anchors: anchors2, doc: doc2, maxAliasCount } = ctx;
          let data = anchors2.get(found);
          if (!data) {
            toJS.toJS(found, null, ctx);
            data = anchors2.get(found);
          }
          if (data?.res === void 0) {
            const msg = "This should not happen: Alias anchor was not resolved?";
            throw new ReferenceError(msg);
          }
          if (maxAliasCount >= 0) {
            data.count += 1;
            if (data.aliasCount === 0)
              data.aliasCount = getAliasCount(doc2, found, anchors2);
            if (data.count * data.aliasCount > maxAliasCount) {
              const msg = "Excessive alias count indicates a resource exhaustion attack";
              throw new ReferenceError(msg);
            }
          }
        }
        return found;
      }
      toJSON(_arg, ctx) {
        if (!ctx)
          return { source: this.source };
        const source = this.resolve(ctx.doc, ctx);
        if (!source) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new ReferenceError(msg);
        }
        return ctx.anchors.get(source).res;
      }
      toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
          anchors.anchorIsValid(this.source);
          if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new Error(msg);
          }
          if (ctx.implicitKey)
            return `${src} `;
        }
        return src;
      }
    };
    function getAliasCount(doc, node, anchors2) {
      if (identity.isAlias(node)) {
        const source = node.resolve(doc);
        const anchor = anchors2 && source && anchors2.get(source);
        return anchor ? anchor.count * anchor.aliasCount : 0;
      } else if (identity.isCollection(node)) {
        let count = 0;
        for (const item of node.items) {
          const c = getAliasCount(doc, item, anchors2);
          if (c > count)
            count = c;
        }
        return count;
      } else if (identity.isPair(node)) {
        const kc = getAliasCount(doc, node.key, anchors2);
        const vc = getAliasCount(doc, node.value, anchors2);
        return Math.max(kc, vc);
      }
      return 1;
    }
    exports.Alias = Alias;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
    var Scalar = class extends Node.NodeBase {
      constructor(value) {
        super(identity.SCALAR);
        this.value = value;
      }
      toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
      }
      toString() {
        return String(this.value);
      }
    };
    Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
    Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
    Scalar.PLAIN = "PLAIN";
    Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
    Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
    exports.Scalar = Scalar;
    exports.isScalarValue = isScalarValue;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/createNode.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var defaultTagPrefix = "tag:yaml.org,2002:";
    function findTagObject(value, tagName, tags) {
      if (tagName) {
        const match = tags.filter((t) => t.tag === tagName);
        const tagObj = match.find((t) => !t.format) ?? match[0];
        if (!tagObj)
          throw new Error(`Tag ${tagName} not found`);
        return tagObj;
      }
      return tags.find((t) => t.identify?.(value) && !t.format);
    }
    function createNode(value, tagName, ctx) {
      if (identity.isDocument(value))
        value = value.contents;
      if (identity.isNode(value))
        return value;
      if (identity.isPair(value)) {
        const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
        map.items.push(value);
        return map;
      }
      if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
        value = value.valueOf();
      }
      const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
      let ref = void 0;
      if (aliasDuplicateObjects && value && typeof value === "object") {
        ref = sourceObjects.get(value);
        if (ref) {
          ref.anchor ?? (ref.anchor = onAnchor(value));
          return new Alias.Alias(ref.anchor);
        } else {
          ref = { anchor: null, node: null };
          sourceObjects.set(value, ref);
        }
      }
      if (tagName?.startsWith("!!"))
        tagName = defaultTagPrefix + tagName.slice(2);
      let tagObj = findTagObject(value, tagName, schema.tags);
      if (!tagObj) {
        if (value && typeof value.toJSON === "function") {
          value = value.toJSON();
        }
        if (!value || typeof value !== "object") {
          const node2 = new Scalar.Scalar(value);
          if (ref)
            ref.node = node2;
          return node2;
        }
        tagObj = value instanceof Map ? schema[identity.MAP] : Symbol.iterator in Object(value) ? schema[identity.SEQ] : schema[identity.MAP];
      }
      if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
      }
      const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
      if (tagName)
        node.tag = tagName;
      else if (!tagObj.default)
        node.tag = tagObj.tag;
      if (ref)
        ref.node = node;
      return node;
    }
    exports.createNode = createNode;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Collection.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var identity = require_identity();
    var Node = require_Node();
    function collectionFromPath(schema, path14, value) {
      let v = value;
      for (let i = path14.length - 1; i >= 0; --i) {
        const k = path14[i];
        if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
          const a = [];
          a[k] = v;
          v = a;
        } else {
          v = /* @__PURE__ */ new Map([[k, v]]);
        }
      }
      return createNode.createNode(v, void 0, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
          throw new Error("This should not happen, please report a bug.");
        },
        schema,
        sourceObjects: /* @__PURE__ */ new Map()
      });
    }
    var isEmptyPath = (path14) => path14 == null || typeof path14 === "object" && !!path14[Symbol.iterator]().next().done;
    var Collection = class extends Node.NodeBase {
      constructor(type, schema) {
        super(type);
        Object.defineProperty(this, "schema", {
          value: schema,
          configurable: true,
          enumerable: false,
          writable: true
        });
      }
      /**
       * Create a copy of this collection.
       *
       * @param schema - If defined, overwrites the original's schema
       */
      clone(schema) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema)
          copy.schema = schema;
        copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /**
       * Adds a value to the collection. For `!!map` and `!!omap` the value must
       * be a Pair instance or a `{ key, value }` object, which may not have a key
       * that already exists in the map.
       */
      addIn(path14, value) {
        if (isEmptyPath(path14))
          this.add(value);
        else {
          const [key, ...rest] = path14;
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.addIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
      /**
       * Removes a value from the collection.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path14) {
        const [key, ...rest] = path14;
        if (rest.length === 0)
          return this.delete(key);
        const node = this.get(key, true);
        if (identity.isCollection(node))
          return node.deleteIn(rest);
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path14, keepScalar) {
        const [key, ...rest] = path14;
        const node = this.get(key, true);
        if (rest.length === 0)
          return !keepScalar && identity.isScalar(node) ? node.value : node;
        else
          return identity.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
      }
      hasAllNullValues(allowScalar) {
        return this.items.every((node) => {
          if (!identity.isPair(node))
            return false;
          const n = node.value;
          return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
        });
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       */
      hasIn(path14) {
        const [key, ...rest] = path14;
        if (rest.length === 0)
          return this.has(key);
        const node = this.get(key, true);
        return identity.isCollection(node) ? node.hasIn(rest) : false;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path14, value) {
        const [key, ...rest] = path14;
        if (rest.length === 0) {
          this.set(key, value);
        } else {
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.setIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
    };
    exports.Collection = Collection;
    exports.collectionFromPath = collectionFromPath;
    exports.isEmptyPath = isEmptyPath;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyComment.js"(exports) {
    "use strict";
    var stringifyComment = (str2) => str2.replace(/^(?!$)(?: $)?/gm, "#");
    function indentComment(comment, indent) {
      if (/^\n+$/.test(comment))
        return comment.substring(1);
      return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
    }
    var lineComment = (str2, indent, comment) => str2.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str2.endsWith(" ") ? "" : " ") + comment;
    exports.indentComment = indentComment;
    exports.lineComment = lineComment;
    exports.stringifyComment = stringifyComment;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/foldFlowLines.js"(exports) {
    "use strict";
    var FOLD_FLOW = "flow";
    var FOLD_BLOCK = "block";
    var FOLD_QUOTED = "quoted";
    function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
      if (!lineWidth || lineWidth < 0)
        return text;
      if (lineWidth < minContentWidth)
        minContentWidth = 0;
      const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
      if (text.length <= endStep)
        return text;
      const folds = [];
      const escapedFolds = {};
      let end = lineWidth - indent.length;
      if (typeof indentAtStart === "number") {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
          folds.push(0);
        else
          end = lineWidth - indentAtStart;
      }
      let split = void 0;
      let prev = void 0;
      let overflow = false;
      let i = -1;
      let escStart = -1;
      let escEnd = -1;
      if (mode === FOLD_BLOCK) {
        i = consumeMoreIndentedLines(text, i, indent.length);
        if (i !== -1)
          end = i + endStep;
      }
      for (let ch; ch = text[i += 1]; ) {
        if (mode === FOLD_QUOTED && ch === "\\") {
          escStart = i;
          switch (text[i + 1]) {
            case "x":
              i += 3;
              break;
            case "u":
              i += 5;
              break;
            case "U":
              i += 9;
              break;
            default:
              i += 1;
          }
          escEnd = i;
        }
        if (ch === "\n") {
          if (mode === FOLD_BLOCK)
            i = consumeMoreIndentedLines(text, i, indent.length);
          end = i + indent.length + endStep;
          split = void 0;
        } else {
          if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
            const next = text[i + 1];
            if (next && next !== " " && next !== "\n" && next !== "	")
              split = i;
          }
          if (i >= end) {
            if (split) {
              folds.push(split);
              end = split + endStep;
              split = void 0;
            } else if (mode === FOLD_QUOTED) {
              while (prev === " " || prev === "	") {
                prev = ch;
                ch = text[i += 1];
                overflow = true;
              }
              const j = i > escEnd + 1 ? i - 2 : escStart - 1;
              if (escapedFolds[j])
                return text;
              folds.push(j);
              escapedFolds[j] = true;
              end = j + endStep;
              split = void 0;
            } else {
              overflow = true;
            }
          }
        }
        prev = ch;
      }
      if (overflow && onOverflow)
        onOverflow();
      if (folds.length === 0)
        return text;
      if (onFold)
        onFold();
      let res = text.slice(0, folds[0]);
      for (let i2 = 0; i2 < folds.length; ++i2) {
        const fold = folds[i2];
        const end2 = folds[i2 + 1] || text.length;
        if (fold === 0)
          res = `
${indent}${text.slice(0, end2)}`;
        else {
          if (mode === FOLD_QUOTED && escapedFolds[fold])
            res += `${text[fold]}\\`;
          res += `
${indent}${text.slice(fold + 1, end2)}`;
        }
      }
      return res;
    }
    function consumeMoreIndentedLines(text, i, indent) {
      let end = i;
      let start = i + 1;
      let ch = text[start];
      while (ch === " " || ch === "	") {
        if (i < start + indent) {
          ch = text[++i];
        } else {
          do {
            ch = text[++i];
          } while (ch && ch !== "\n");
          end = i;
          start = i + 1;
          ch = text[start];
        }
      }
      return end;
    }
    exports.FOLD_BLOCK = FOLD_BLOCK;
    exports.FOLD_FLOW = FOLD_FLOW;
    exports.FOLD_QUOTED = FOLD_QUOTED;
    exports.foldFlowLines = foldFlowLines;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyString.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var foldFlowLines = require_foldFlowLines();
    var getFoldOptions = (ctx, isBlock) => ({
      indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
      lineWidth: ctx.options.lineWidth,
      minContentWidth: ctx.options.minContentWidth
    });
    var containsDocumentMarker = (str2) => /^(%|---|\.\.\.)/m.test(str2);
    function lineLengthOverLimit(str2, lineWidth, indentLength) {
      if (!lineWidth || lineWidth < 0)
        return false;
      const limit = lineWidth - indentLength;
      const strLen = str2.length;
      if (strLen <= limit)
        return false;
      for (let i = 0, start = 0; i < strLen; ++i) {
        if (str2[i] === "\n") {
          if (i - start > limit)
            return true;
          start = i + 1;
          if (strLen - start <= limit)
            return false;
        }
      }
      return true;
    }
    function doubleQuotedString(value, ctx) {
      const json = JSON.stringify(value);
      if (ctx.options.doubleQuotedAsJSON)
        return json;
      const { implicitKey } = ctx;
      const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      let str2 = "";
      let start = 0;
      for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
        if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
          str2 += json.slice(start, i) + "\\ ";
          i += 1;
          start = i;
          ch = "\\";
        }
        if (ch === "\\")
          switch (json[i + 1]) {
            case "u":
              {
                str2 += json.slice(start, i);
                const code = json.substr(i + 2, 4);
                switch (code) {
                  case "0000":
                    str2 += "\\0";
                    break;
                  case "0007":
                    str2 += "\\a";
                    break;
                  case "000b":
                    str2 += "\\v";
                    break;
                  case "001b":
                    str2 += "\\e";
                    break;
                  case "0085":
                    str2 += "\\N";
                    break;
                  case "00a0":
                    str2 += "\\_";
                    break;
                  case "2028":
                    str2 += "\\L";
                    break;
                  case "2029":
                    str2 += "\\P";
                    break;
                  default:
                    if (code.substr(0, 2) === "00")
                      str2 += "\\x" + code.substr(2);
                    else
                      str2 += json.substr(i, 6);
                }
                i += 5;
                start = i + 1;
              }
              break;
            case "n":
              if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
                i += 1;
              } else {
                str2 += json.slice(start, i) + "\n\n";
                while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                  str2 += "\n";
                  i += 2;
                }
                str2 += indent;
                if (json[i + 2] === " ")
                  str2 += "\\";
                i += 1;
                start = i + 1;
              }
              break;
            default:
              i += 1;
          }
      }
      str2 = start ? str2 + json.slice(start) : json;
      return implicitKey ? str2 : foldFlowLines.foldFlowLines(str2, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
    }
    function singleQuotedString(value, ctx) {
      if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
        return doubleQuotedString(value, ctx);
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
      return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function quotedString(value, ctx) {
      const { singleQuote } = ctx.options;
      let qs;
      if (singleQuote === false)
        qs = doubleQuotedString;
      else {
        const hasDouble = value.includes('"');
        const hasSingle = value.includes("'");
        if (hasDouble && !hasSingle)
          qs = singleQuotedString;
        else if (hasSingle && !hasDouble)
          qs = doubleQuotedString;
        else
          qs = singleQuote ? singleQuotedString : doubleQuotedString;
      }
      return qs(value, ctx);
    }
    var blockEndNewlines;
    try {
      blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
    } catch {
      blockEndNewlines = /\n+(?!\n|$)/g;
    }
    function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
      const { blockQuote, commentString, lineWidth } = ctx.options;
      if (!blockQuote || /\n[\t ]+$/.test(value)) {
        return quotedString(value, ctx);
      }
      const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
      const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
      if (!value)
        return literal ? "|\n" : ">\n";
      let chomp;
      let endStart;
      for (endStart = value.length; endStart > 0; --endStart) {
        const ch = value[endStart - 1];
        if (ch !== "\n" && ch !== "	" && ch !== " ")
          break;
      }
      let end = value.substring(endStart);
      const endNlPos = end.indexOf("\n");
      if (endNlPos === -1) {
        chomp = "-";
      } else if (value === end || endNlPos !== end.length - 1) {
        chomp = "+";
        if (onChompKeep)
          onChompKeep();
      } else {
        chomp = "";
      }
      if (end) {
        value = value.slice(0, -end.length);
        if (end[end.length - 1] === "\n")
          end = end.slice(0, -1);
        end = end.replace(blockEndNewlines, `$&${indent}`);
      }
      let startWithSpace = false;
      let startEnd;
      let startNlPos = -1;
      for (startEnd = 0; startEnd < value.length; ++startEnd) {
        const ch = value[startEnd];
        if (ch === " ")
          startWithSpace = true;
        else if (ch === "\n")
          startNlPos = startEnd;
        else
          break;
      }
      let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
      if (start) {
        value = value.substring(start.length);
        start = start.replace(/\n+/g, `$&${indent}`);
      }
      const indentSize = indent ? "2" : "1";
      let header = (startWithSpace ? indentSize : "") + chomp;
      if (comment) {
        header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
        if (onComment)
          onComment();
      }
      if (!literal) {
        const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
          foldOptions.onOverflow = () => {
            literalFallback = true;
          };
        }
        const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
        if (!literalFallback)
          return `>${header}
${indent}${body}`;
      }
      value = value.replace(/\n+/g, `$&${indent}`);
      return `|${header}
${indent}${start}${value}${end}`;
    }
    function plainString(item, ctx, onComment, onChompKeep) {
      const { type, value } = item;
      const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
      if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
        return quotedString(value, ctx);
      }
      if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
        return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
      }
      if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes("\n")) {
        return blockString(item, ctx, onComment, onChompKeep);
      }
      if (containsDocumentMarker(value)) {
        if (indent === "") {
          ctx.forceBlockIndent = true;
          return blockString(item, ctx, onComment, onChompKeep);
        } else if (implicitKey && indent === indentStep) {
          return quotedString(value, ctx);
        }
      }
      const str2 = value.replace(/\n+/g, `$&
${indent}`);
      if (actualString) {
        const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str2);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
          return quotedString(value, ctx);
      }
      return implicitKey ? str2 : foldFlowLines.foldFlowLines(str2, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function stringifyString(item, ctx, onComment, onChompKeep) {
      const { implicitKey, inFlow } = ctx;
      const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
      let { type } = item;
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
          type = Scalar.Scalar.QUOTE_DOUBLE;
      }
      const _stringify = (_type) => {
        switch (_type) {
          case Scalar.Scalar.BLOCK_FOLDED:
          case Scalar.Scalar.BLOCK_LITERAL:
            return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
          case Scalar.Scalar.QUOTE_DOUBLE:
            return doubleQuotedString(ss.value, ctx);
          case Scalar.Scalar.QUOTE_SINGLE:
            return singleQuotedString(ss.value, ctx);
          case Scalar.Scalar.PLAIN:
            return plainString(ss, ctx, onComment, onChompKeep);
          default:
            return null;
        }
      };
      let res = _stringify(type);
      if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t = implicitKey && defaultKeyType || defaultStringType;
        res = _stringify(t);
        if (res === null)
          throw new Error(`Unsupported default string type ${t}`);
      }
      return res;
    }
    exports.stringifyString = stringifyString;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringify.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var identity = require_identity();
    var stringifyComment = require_stringifyComment();
    var stringifyString = require_stringifyString();
    function createStringifyContext(doc, options) {
      const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: "PLAIN",
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: "false",
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: "null",
        simpleKeys: false,
        singleQuote: null,
        trailingComma: false,
        trueStr: "true",
        verifyAliasOrder: true
      }, doc.schema.toStringOptions, options);
      let inFlow;
      switch (opt.collectionStyle) {
        case "block":
          inFlow = false;
          break;
        case "flow":
          inFlow = true;
          break;
        default:
          inFlow = null;
      }
      return {
        anchors: /* @__PURE__ */ new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
        indent: "",
        indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
        inFlow,
        options: opt
      };
    }
    function getTagObject(tags, item) {
      if (item.tag) {
        const match = tags.filter((t) => t.tag === item.tag);
        if (match.length > 0)
          return match.find((t) => t.format === item.format) ?? match[0];
      }
      let tagObj = void 0;
      let obj2;
      if (identity.isScalar(item)) {
        obj2 = item.value;
        let match = tags.filter((t) => t.identify?.(obj2));
        if (match.length > 1) {
          const testMatch = match.filter((t) => t.test);
          if (testMatch.length > 0)
            match = testMatch;
        }
        tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
      } else {
        obj2 = item;
        tagObj = tags.find((t) => t.nodeClass && obj2 instanceof t.nodeClass);
      }
      if (!tagObj) {
        const name = obj2?.constructor?.name ?? (obj2 === null ? "null" : typeof obj2);
        throw new Error(`Tag not resolved for ${name} value`);
      }
      return tagObj;
    }
    function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
      if (!doc.directives)
        return "";
      const props = [];
      const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
      if (anchor && anchors.anchorIsValid(anchor)) {
        anchors$1.add(anchor);
        props.push(`&${anchor}`);
      }
      const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
      if (tag)
        props.push(doc.directives.tagString(tag));
      return props.join(" ");
    }
    function stringify(item, ctx, onComment, onChompKeep) {
      if (identity.isPair(item))
        return item.toString(ctx, onComment, onChompKeep);
      if (identity.isAlias(item)) {
        if (ctx.doc.directives)
          return item.toString(ctx);
        if (ctx.resolvedAliases?.has(item)) {
          throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        } else {
          if (ctx.resolvedAliases)
            ctx.resolvedAliases.add(item);
          else
            ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
          item = item.resolve(ctx.doc);
        }
      }
      let tagObj = void 0;
      const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
      tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
      const props = stringifyProps(node, tagObj, ctx);
      if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
      const str2 = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
      if (!props)
        return str2;
      return identity.isScalar(node) || str2[0] === "{" || str2[0] === "[" ? `${props} ${str2}` : `${props}
${ctx.indent}${str2}`;
    }
    exports.createStringifyContext = createStringifyContext;
    exports.stringify = stringify;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyPair.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
      const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
      let keyComment = identity.isNode(key) && key.comment || null;
      if (simpleKeys) {
        if (keyComment) {
          throw new Error("With simple keys, key nodes cannot have comments");
        }
        if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
          const msg = "With simple keys, collection cannot be used as a key value";
          throw new Error(msg);
        }
      }
      let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
      ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
      });
      let keyCommentDone = false;
      let chompKeep = false;
      let str2 = stringify.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
      if (!explicitKey && !ctx.inFlow && str2.length > 1024) {
        if (simpleKeys)
          throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
        explicitKey = true;
      }
      if (ctx.inFlow) {
        if (allNullValues || value == null) {
          if (keyCommentDone && onComment)
            onComment();
          return str2 === "" ? "?" : explicitKey ? `? ${str2}` : str2;
        }
      } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
        str2 = `? ${str2}`;
        if (keyComment && !keyCommentDone) {
          str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(keyComment));
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str2;
      }
      if (keyCommentDone)
        keyComment = null;
      if (explicitKey) {
        if (keyComment)
          str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(keyComment));
        str2 = `? ${str2}
${indent}:`;
      } else {
        str2 = `${str2}:`;
        if (keyComment)
          str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(keyComment));
      }
      let vsb, vcb, valueComment;
      if (identity.isNode(value)) {
        vsb = !!value.spaceBefore;
        vcb = value.commentBefore;
        valueComment = value.comment;
      } else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value && typeof value === "object")
          value = doc.createNode(value);
      }
      ctx.implicitKey = false;
      if (!explicitKey && !keyComment && identity.isScalar(value))
        ctx.indentAtStart = str2.length + 1;
      chompKeep = false;
      if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
        ctx.indent = ctx.indent.substring(2);
      }
      let valueCommentDone = false;
      const valueStr = stringify.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
      let ws = " ";
      if (keyComment || vsb || vcb) {
        ws = vsb ? "\n" : "";
        if (vcb) {
          const cs = commentString(vcb);
          ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
        }
        if (valueStr === "" && !ctx.inFlow) {
          if (ws === "\n" && valueComment)
            ws = "\n\n";
        } else {
          ws += `
${ctx.indent}`;
        }
      } else if (!explicitKey && identity.isCollection(value)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf("\n");
        const hasNewline = nl0 !== -1;
        const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
        if (hasNewline || !flow) {
          let hasPropsLine = false;
          if (hasNewline && (vs0 === "&" || vs0 === "!")) {
            let sp0 = valueStr.indexOf(" ");
            if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
              sp0 = valueStr.indexOf(" ", sp0 + 1);
            }
            if (sp0 === -1 || nl0 < sp0)
              hasPropsLine = true;
          }
          if (!hasPropsLine)
            ws = `
${ctx.indent}`;
        }
      } else if (valueStr === "" || valueStr[0] === "\n") {
        ws = "";
      }
      str2 += ws + valueStr;
      if (ctx.inFlow) {
        if (valueCommentDone && onComment)
          onComment();
      } else if (valueComment && !valueCommentDone) {
        str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(valueComment));
      } else if (chompKeep && onChompKeep) {
        onChompKeep();
      }
      return str2;
    }
    exports.stringifyPair = stringifyPair;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/log.js
var require_log = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/log.js"(exports) {
    "use strict";
    var node_process = __require("process");
    function debug(logLevel, ...messages) {
      if (logLevel === "debug")
        console.log(...messages);
    }
    function warn(logLevel, warning) {
      if (logLevel === "debug" || logLevel === "warn") {
        if (typeof node_process.emitWarning === "function")
          node_process.emitWarning(warning);
        else
          console.warn(warning);
      }
    }
    exports.debug = debug;
    exports.warn = warn;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/merge.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var MERGE_KEY = "<<";
    var merge = {
      identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
      default: "key",
      tag: "tag:yaml.org,2002:merge",
      test: /^<<$/,
      resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
      }),
      stringify: () => MERGE_KEY
    };
    var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
    function addMergeToJSMap(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (identity.isSeq(source))
        for (const it of source.items)
          mergeValue(ctx, map, it);
      else if (Array.isArray(source))
        for (const it of source)
          mergeValue(ctx, map, it);
      else
        mergeValue(ctx, map, source);
    }
    function mergeValue(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (!identity.isMap(source))
        throw new Error("Merge sources must be maps or map aliases");
      const srcMap = source.toJSON(null, ctx, Map);
      for (const [key, value2] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key))
            map.set(key, value2);
        } else if (map instanceof Set) {
          map.add(key);
        } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
          Object.defineProperty(map, key, {
            value: value2,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      return map;
    }
    function resolveAliasValue(ctx, value) {
      return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
    }
    exports.addMergeToJSMap = addMergeToJSMap;
    exports.isMergeKey = isMergeKey;
    exports.merge = merge;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/addPairToJSMap.js"(exports) {
    "use strict";
    var log = require_log();
    var merge = require_merge();
    var stringify = require_stringify();
    var identity = require_identity();
    var toJS = require_toJS();
    function addPairToJSMap(ctx, map, { key, value }) {
      if (identity.isNode(key) && key.addToJSMap)
        key.addToJSMap(ctx, map, value);
      else if (merge.isMergeKey(ctx, key))
        merge.addMergeToJSMap(ctx, map, value);
      else {
        const jsKey = toJS.toJS(key, "", ctx);
        if (map instanceof Map) {
          map.set(jsKey, toJS.toJS(value, jsKey, ctx));
        } else if (map instanceof Set) {
          map.add(jsKey);
        } else {
          const stringKey = stringifyKey(key, jsKey, ctx);
          const jsValue = toJS.toJS(value, stringKey, ctx);
          if (stringKey in map)
            Object.defineProperty(map, stringKey, {
              value: jsValue,
              writable: true,
              enumerable: true,
              configurable: true
            });
          else
            map[stringKey] = jsValue;
        }
      }
      return map;
    }
    function stringifyKey(key, jsKey, ctx) {
      if (jsKey === null)
        return "";
      if (typeof jsKey !== "object")
        return String(jsKey);
      if (identity.isNode(key) && ctx?.doc) {
        const strCtx = stringify.createStringifyContext(ctx.doc, {});
        strCtx.anchors = /* @__PURE__ */ new Set();
        for (const node of ctx.anchors.keys())
          strCtx.anchors.add(node.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key.toString(strCtx);
        if (!ctx.mapKeyWarned) {
          let jsonStr = JSON.stringify(strKey);
          if (jsonStr.length > 40)
            jsonStr = jsonStr.substring(0, 36) + '..."';
          log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
          ctx.mapKeyWarned = true;
        }
        return strKey;
      }
      return JSON.stringify(jsKey);
    }
    exports.addPairToJSMap = addPairToJSMap;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/Pair.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyPair = require_stringifyPair();
    var addPairToJSMap = require_addPairToJSMap();
    var identity = require_identity();
    function createPair(key, value, ctx) {
      const k = createNode.createNode(key, void 0, ctx);
      const v = createNode.createNode(value, void 0, ctx);
      return new Pair(k, v);
    }
    var Pair = class _Pair {
      constructor(key, value = null) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
        this.key = key;
        this.value = value;
      }
      clone(schema) {
        let { key, value } = this;
        if (identity.isNode(key))
          key = key.clone(schema);
        if (identity.isNode(value))
          value = value.clone(schema);
        return new _Pair(key, value);
      }
      toJSON(_, ctx) {
        const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        return addPairToJSMap.addPairToJSMap(ctx, pair, this);
      }
      toString(ctx, onComment, onChompKeep) {
        return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
      }
    };
    exports.Pair = Pair;
    exports.createPair = createPair;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyCollection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyCollection(collection, ctx, options) {
      const flow = ctx.inFlow ?? collection.flow;
      const stringify2 = flow ? stringifyFlowCollection : stringifyBlockCollection;
      return stringify2(collection, ctx, options);
    }
    function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
      const { indent, options: { commentString } } = ctx;
      const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
      let chompKeep = false;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment2 = null;
        if (identity.isNode(item)) {
          if (!chompKeep && item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
          if (item.comment)
            comment2 = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (!chompKeep && ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
          }
        }
        chompKeep = false;
        let str3 = stringify.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
        if (comment2)
          str3 += stringifyComment.lineComment(str3, itemIndent, commentString(comment2));
        if (chompKeep && comment2)
          chompKeep = false;
        lines.push(blockItemPrefix + str3);
      }
      let str2;
      if (lines.length === 0) {
        str2 = flowChars.start + flowChars.end;
      } else {
        str2 = lines[0];
        for (let i = 1; i < lines.length; ++i) {
          const line = lines[i];
          str2 += line ? `
${indent}${line}` : "\n";
        }
      }
      if (comment) {
        str2 += "\n" + stringifyComment.indentComment(commentString(comment), indent);
        if (onComment)
          onComment();
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str2;
    }
    function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
      const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
      itemIndent += indentStep;
      const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
      });
      let reqNewline = false;
      let linesAtValue = 0;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment = null;
        if (identity.isNode(item)) {
          if (item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, false);
          if (item.comment)
            comment = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, false);
            if (ik.comment)
              reqNewline = true;
          }
          const iv = identity.isNode(item.value) ? item.value : null;
          if (iv) {
            if (iv.comment)
              comment = iv.comment;
            if (iv.commentBefore)
              reqNewline = true;
          } else if (item.value == null && ik?.comment) {
            comment = ik.comment;
          }
        }
        if (comment)
          reqNewline = true;
        let str2 = stringify.stringify(item, itemCtx, () => comment = null);
        reqNewline || (reqNewline = lines.length > linesAtValue || str2.includes("\n"));
        if (i < items.length - 1) {
          str2 += ",";
        } else if (ctx.options.trailingComma) {
          if (ctx.options.lineWidth > 0) {
            reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str2.length + 2) > ctx.options.lineWidth);
          }
          if (reqNewline) {
            str2 += ",";
          }
        }
        if (comment)
          str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment));
        lines.push(str2);
        linesAtValue = lines.length;
      }
      const { start, end } = flowChars;
      if (lines.length === 0) {
        return start + end;
      } else {
        if (!reqNewline) {
          const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
          reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
          let str2 = start;
          for (const line of lines)
            str2 += line ? `
${indentStep}${indent}${line}` : "\n";
          return `${str2}
${indent}${end}`;
        } else {
          return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
        }
      }
    }
    function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
      if (comment && chompKeep)
        comment = comment.replace(/^\n+/, "");
      if (comment) {
        const ic = stringifyComment.indentComment(commentString(comment), indent);
        lines.push(ic.trimStart());
      }
    }
    exports.stringifyCollection = stringifyCollection;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/YAMLMap.js"(exports) {
    "use strict";
    var stringifyCollection = require_stringifyCollection();
    var addPairToJSMap = require_addPairToJSMap();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    function findPair(items, key) {
      const k = identity.isScalar(key) ? key.value : key;
      for (const it of items) {
        if (identity.isPair(it)) {
          if (it.key === key || it.key === k)
            return it;
          if (identity.isScalar(it.key) && it.key.value === k)
            return it;
        }
      }
      return void 0;
    }
    var YAMLMap = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:map";
      }
      constructor(schema) {
        super(identity.MAP, schema);
        this.items = [];
      }
      /**
       * A generic collection parsing method that can be extended
       * to other node classes that inherit from YAMLMap
       */
      static from(schema, obj2, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map = new this(schema);
        const add = (key, value) => {
          if (typeof replacer === "function")
            value = replacer.call(obj2, key, value);
          else if (Array.isArray(replacer) && !replacer.includes(key))
            return;
          if (value !== void 0 || keepUndefined)
            map.items.push(Pair.createPair(key, value, ctx));
        };
        if (obj2 instanceof Map) {
          for (const [key, value] of obj2)
            add(key, value);
        } else if (obj2 && typeof obj2 === "object") {
          for (const key of Object.keys(obj2))
            add(key, obj2[key]);
        }
        if (typeof schema.sortMapEntries === "function") {
          map.items.sort(schema.sortMapEntries);
        }
        return map;
      }
      /**
       * Adds a value to the collection.
       *
       * @param overwrite - If not set `true`, using a key that is already in the
       *   collection will throw. Otherwise, overwrites the previous value.
       */
      add(pair, overwrite) {
        let _pair;
        if (identity.isPair(pair))
          _pair = pair;
        else if (!pair || typeof pair !== "object" || !("key" in pair)) {
          _pair = new Pair.Pair(pair, pair?.value);
        } else
          _pair = new Pair.Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
          if (!overwrite)
            throw new Error(`Key ${_pair.key} already set`);
          if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
            prev.value.value = _pair.value;
          else
            prev.value = _pair.value;
        } else if (sortEntries) {
          const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
          if (i === -1)
            this.items.push(_pair);
          else
            this.items.splice(i, 0, _pair);
        } else {
          this.items.push(_pair);
        }
      }
      delete(key) {
        const it = findPair(this.items, key);
        if (!it)
          return false;
        const del = this.items.splice(this.items.indexOf(it), 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const it = findPair(this.items, key);
        const node = it?.value;
        return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? void 0;
      }
      has(key) {
        return !!findPair(this.items, key);
      }
      set(key, value) {
        this.add(new Pair.Pair(key, value), true);
      }
      /**
       * @param ctx - Conversion context, originally set in Document#toJS()
       * @param {Class} Type - If set, forces the returned collection type
       * @returns Instance of Type, Map, or Object
       */
      toJSON(_, ctx, Type) {
        const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const item of this.items)
          addPairToJSMap.addPairToJSMap(ctx, map, item);
        return map;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        for (const item of this.items) {
          if (!identity.isPair(item))
            throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
          ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "",
          flowChars: { start: "{", end: "}" },
          itemIndent: ctx.indent || "",
          onChompKeep,
          onComment
        });
      }
    };
    exports.YAMLMap = YAMLMap;
    exports.findPair = findPair;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/map.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLMap = require_YAMLMap();
    var map = {
      collection: "map",
      default: true,
      nodeClass: YAMLMap.YAMLMap,
      tag: "tag:yaml.org,2002:map",
      resolve(map2, onError) {
        if (!identity.isMap(map2))
          onError("Expected a mapping for this tag");
        return map2;
      },
      createNode: (schema, obj2, ctx) => YAMLMap.YAMLMap.from(schema, obj2, ctx)
    };
    exports.map = map;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/nodes/YAMLSeq.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyCollection = require_stringifyCollection();
    var Collection = require_Collection();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var toJS = require_toJS();
    var YAMLSeq = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:seq";
      }
      constructor(schema) {
        super(identity.SEQ, schema);
        this.items = [];
      }
      add(value) {
        this.items.push(value);
      }
      /**
       * Removes a value from the collection.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       *
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return void 0;
        const it = this.items[idx];
        return !keepScalar && identity.isScalar(it) ? it.value : it;
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       */
      has(key) {
        const idx = asItemIndex(key);
        return typeof idx === "number" && idx < this.items.length;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       *
       * If `key` does not contain a representation of an integer, this will throw.
       * It may be wrapped in a `Scalar`.
       */
      set(key, value) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          throw new Error(`Expected a valid index, not ${key}.`);
        const prev = this.items[idx];
        if (identity.isScalar(prev) && Scalar.isScalarValue(value))
          prev.value = value;
        else
          this.items[idx] = value;
      }
      toJSON(_, ctx) {
        const seq = [];
        if (ctx?.onCreate)
          ctx.onCreate(seq);
        let i = 0;
        for (const item of this.items)
          seq.push(toJS.toJS(item, String(i++), ctx));
        return seq;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "- ",
          flowChars: { start: "[", end: "]" },
          itemIndent: (ctx.indent || "") + "  ",
          onChompKeep,
          onComment
        });
      }
      static from(schema, obj2, ctx) {
        const { replacer } = ctx;
        const seq = new this(schema);
        if (obj2 && Symbol.iterator in Object(obj2)) {
          let i = 0;
          for (let it of obj2) {
            if (typeof replacer === "function") {
              const key = obj2 instanceof Set ? it : String(i++);
              it = replacer.call(obj2, key, it);
            }
            seq.items.push(createNode.createNode(it, void 0, ctx));
          }
        }
        return seq;
      }
    };
    function asItemIndex(key) {
      let idx = identity.isScalar(key) ? key.value : key;
      if (idx && typeof idx === "string")
        idx = Number(idx);
      return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
    }
    exports.YAMLSeq = YAMLSeq;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/seq.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLSeq = require_YAMLSeq();
    var seq = {
      collection: "seq",
      default: true,
      nodeClass: YAMLSeq.YAMLSeq,
      tag: "tag:yaml.org,2002:seq",
      resolve(seq2, onError) {
        if (!identity.isSeq(seq2))
          onError("Expected a sequence for this tag");
        return seq2;
      },
      createNode: (schema, obj2, ctx) => YAMLSeq.YAMLSeq.from(schema, obj2, ctx)
    };
    exports.seq = seq;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/string.js"(exports) {
    "use strict";
    var stringifyString = require_stringifyString();
    var string = {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str2) => str2,
      stringify(item, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
      }
    };
    exports.string = string;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/common/null.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var nullTag = {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => new Scalar.Scalar(null),
      stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
    };
    exports.nullTag = nullTag;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var boolTag = {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
      resolve: (str2) => new Scalar.Scalar(str2[0] === "t" || str2[0] === "T"),
      stringify({ source, value }, ctx) {
        if (source && boolTag.test.test(source)) {
          const sv = source[0] === "t" || source[0] === "T";
          if (value === sv)
            return source;
        }
        return value ? ctx.options.trueStr : ctx.options.falseStr;
      }
    };
    exports.boolTag = boolTag;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyNumber.js"(exports) {
    "use strict";
    function stringifyNumber({ format, minFractionDigits, tag, value }) {
      if (typeof value === "bigint")
        return String(value);
      const num = typeof value === "number" ? value : Number(value);
      if (!isFinite(num))
        return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
      let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
      if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
        let i = n.indexOf(".");
        if (i < 0) {
          i = n.length;
          n += ".";
        }
        let d = minFractionDigits - (n.length - i - 1);
        while (d-- > 0)
          n += "0";
      }
      return n;
    }
    exports.stringifyNumber = stringifyNumber;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str2) => str2.slice(-3).toLowerCase() === "nan" ? NaN : str2[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (str2) => parseFloat(str2),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
      resolve(str2) {
        const node = new Scalar.Scalar(parseFloat(str2));
        const dot = str2.indexOf(".");
        if (dot !== -1 && str2[str2.length - 1] === "0")
          node.minFractionDigits = str2.length - dot - 1;
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    var intResolve = (str2, offset2, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str2) : parseInt(str2.substring(offset2), radix);
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value) && value >= 0)
        return prefix + value.toString(radix);
      return stringifyNumber.stringifyNumber(node);
    }
    var intOct = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^0o[0-7]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 8, opt),
      stringify: (node) => intStringify(node, 8, "0o")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x[0-9a-fA-F]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/core/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.boolTag,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float
    ];
    exports.schema = schema;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/json/schema.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var map = require_map();
    var seq = require_seq();
    function intIdentify(value) {
      return typeof value === "bigint" || Number.isInteger(value);
    }
    var stringifyJSON = ({ value }) => JSON.stringify(value);
    var jsonScalars = [
      {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: (str2) => str2,
        stringify: stringifyJSON
      },
      {
        identify: (value) => value == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
      },
      {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true$|^false$/,
        resolve: (str2) => str2 === "true",
        stringify: stringifyJSON
      },
      {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str2, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str2) : parseInt(str2, 10),
        stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
      },
      {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str2) => parseFloat(str2),
        stringify: stringifyJSON
      }
    ];
    var jsonError = {
      default: true,
      tag: "",
      test: /^/,
      resolve(str2, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str2)}`);
        return str2;
      }
    };
    var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
    exports.schema = schema;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/binary.js"(exports) {
    "use strict";
    var node_buffer = __require("buffer");
    var Scalar = require_Scalar();
    var stringifyString = require_stringifyString();
    var binary = {
      identify: (value) => value instanceof Uint8Array,
      // Buffer inherits from Uint8Array
      default: false,
      tag: "tag:yaml.org,2002:binary",
      /**
       * Returns a Buffer in node and an Uint8Array in browsers
       *
       * To use the resulting buffer as an image, you'll want to do something like:
       *
       *   const blob = new Blob([buffer], { type: 'image/jpeg' })
       *   document.querySelector('#photo').src = URL.createObjectURL(blob)
       */
      resolve(src, onError) {
        if (typeof node_buffer.Buffer === "function") {
          return node_buffer.Buffer.from(src, "base64");
        } else if (typeof atob === "function") {
          const str2 = atob(src.replace(/[\n\r]/g, ""));
          const buffer = new Uint8Array(str2.length);
          for (let i = 0; i < str2.length; ++i)
            buffer[i] = str2.charCodeAt(i);
          return buffer;
        } else {
          onError("This environment does not support reading binary tags; either Buffer or atob is required");
          return src;
        }
      },
      stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
        if (!value)
          return "";
        const buf = value;
        let str2;
        if (typeof node_buffer.Buffer === "function") {
          str2 = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
        } else if (typeof btoa === "function") {
          let s = "";
          for (let i = 0; i < buf.length; ++i)
            s += String.fromCharCode(buf[i]);
          str2 = btoa(s);
        } else {
          throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
        }
        type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
        if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
          const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
          const n = Math.ceil(str2.length / lineWidth);
          const lines = new Array(n);
          for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
            lines[i] = str2.substr(o, lineWidth);
          }
          str2 = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
        }
        return stringifyString.stringifyString({ comment, type, value: str2 }, ctx, onComment, onChompKeep);
      }
    };
    exports.binary = binary;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/pairs.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLSeq = require_YAMLSeq();
    function resolvePairs(seq, onError) {
      if (identity.isSeq(seq)) {
        for (let i = 0; i < seq.items.length; ++i) {
          let item = seq.items[i];
          if (identity.isPair(item))
            continue;
          else if (identity.isMap(item)) {
            if (item.items.length > 1)
              onError("Each pair must have its own sequence indicator");
            const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
            if (item.commentBefore)
              pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
            if (item.comment) {
              const cn = pair.value ?? pair.key;
              cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
            }
            item = pair;
          }
          seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
        }
      } else
        onError("Expected a sequence for this tag");
      return seq;
    }
    function createPairs(schema, iterable, ctx) {
      const { replacer } = ctx;
      const pairs2 = new YAMLSeq.YAMLSeq(schema);
      pairs2.tag = "tag:yaml.org,2002:pairs";
      let i = 0;
      if (iterable && Symbol.iterator in Object(iterable))
        for (let it of iterable) {
          if (typeof replacer === "function")
            it = replacer.call(iterable, String(i++), it);
          let key, value;
          if (Array.isArray(it)) {
            if (it.length === 2) {
              key = it[0];
              value = it[1];
            } else
              throw new TypeError(`Expected [key, value] tuple: ${it}`);
          } else if (it && it instanceof Object) {
            const keys = Object.keys(it);
            if (keys.length === 1) {
              key = keys[0];
              value = it[key];
            } else {
              throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
            }
          } else {
            key = it;
          }
          pairs2.items.push(Pair.createPair(key, value, ctx));
        }
      return pairs2;
    }
    var pairs = {
      collection: "seq",
      default: false,
      tag: "tag:yaml.org,2002:pairs",
      resolve: resolvePairs,
      createNode: createPairs
    };
    exports.createPairs = createPairs;
    exports.pairs = pairs;
    exports.resolvePairs = resolvePairs;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/omap.js"(exports) {
    "use strict";
    var identity = require_identity();
    var toJS = require_toJS();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var pairs = require_pairs();
    var YAMLOMap = class _YAMLOMap extends YAMLSeq.YAMLSeq {
      constructor() {
        super();
        this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
        this.tag = _YAMLOMap.tag;
      }
      /**
       * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
       * but TypeScript won't allow widening the signature of a child method.
       */
      toJSON(_, ctx) {
        if (!ctx)
          return super.toJSON(_);
        const map = /* @__PURE__ */ new Map();
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const pair of this.items) {
          let key, value;
          if (identity.isPair(pair)) {
            key = toJS.toJS(pair.key, "", ctx);
            value = toJS.toJS(pair.value, key, ctx);
          } else {
            key = toJS.toJS(pair, "", ctx);
          }
          if (map.has(key))
            throw new Error("Ordered maps must not include duplicate keys");
          map.set(key, value);
        }
        return map;
      }
      static from(schema, iterable, ctx) {
        const pairs$1 = pairs.createPairs(schema, iterable, ctx);
        const omap2 = new this();
        omap2.items = pairs$1.items;
        return omap2;
      }
    };
    YAMLOMap.tag = "tag:yaml.org,2002:omap";
    var omap = {
      collection: "seq",
      identify: (value) => value instanceof Map,
      nodeClass: YAMLOMap,
      default: false,
      tag: "tag:yaml.org,2002:omap",
      resolve(seq, onError) {
        const pairs$1 = pairs.resolvePairs(seq, onError);
        const seenKeys = [];
        for (const { key } of pairs$1.items) {
          if (identity.isScalar(key)) {
            if (seenKeys.includes(key.value)) {
              onError(`Ordered maps must not include duplicate keys: ${key.value}`);
            } else {
              seenKeys.push(key.value);
            }
          }
        }
        return Object.assign(new YAMLOMap(), pairs$1);
      },
      createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
    };
    exports.YAMLOMap = YAMLOMap;
    exports.omap = omap;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function boolStringify({ value, source }, ctx) {
      const boolObj = value ? trueTag : falseTag;
      if (source && boolObj.test.test(source))
        return source;
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
    var trueTag = {
      identify: (value) => value === true,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
      resolve: () => new Scalar.Scalar(true),
      stringify: boolStringify
    };
    var falseTag = {
      identify: (value) => value === false,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
      resolve: () => new Scalar.Scalar(false),
      stringify: boolStringify
    };
    exports.falseTag = falseTag;
    exports.trueTag = trueTag;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str2) => str2.slice(-3).toLowerCase() === "nan" ? NaN : str2[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: (str2) => parseFloat(str2.replace(/_/g, "")),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
      resolve(str2) {
        const node = new Scalar.Scalar(parseFloat(str2.replace(/_/g, "")));
        const dot = str2.indexOf(".");
        if (dot !== -1) {
          const f = str2.substring(dot + 1).replace(/_/g, "");
          if (f[f.length - 1] === "0")
            node.minFractionDigits = f.length;
        }
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    function intResolve(str2, offset2, radix, { intAsBigInt }) {
      const sign = str2[0];
      if (sign === "-" || sign === "+")
        offset2 += 1;
      str2 = str2.substring(offset2).replace(/_/g, "");
      if (intAsBigInt) {
        switch (radix) {
          case 2:
            str2 = `0b${str2}`;
            break;
          case 8:
            str2 = `0o${str2}`;
            break;
          case 16:
            str2 = `0x${str2}`;
            break;
        }
        const n2 = BigInt(str2);
        return sign === "-" ? BigInt(-1) * n2 : n2;
      }
      const n = parseInt(str2, radix);
      return sign === "-" ? -1 * n : n;
    }
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value)) {
        const str2 = value.toString(radix);
        return value < 0 ? "-" + prefix + str2.substr(1) : prefix + str2;
      }
      return stringifyNumber.stringifyNumber(node);
    }
    var intBin = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "BIN",
      test: /^[-+]?0b[0-1_]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 2, opt),
      stringify: (node) => intStringify(node, 2, "0b")
    };
    var intOct = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^[-+]?0[0-7_]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 1, 8, opt),
      stringify: (node) => intStringify(node, 8, "0")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^[-+]?0x[0-9a-fA-F_]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intBin = intBin;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/set.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSet = class _YAMLSet extends YAMLMap.YAMLMap {
      constructor(schema) {
        super(schema);
        this.tag = _YAMLSet.tag;
      }
      add(key) {
        let pair;
        if (identity.isPair(key))
          pair = key;
        else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
          pair = new Pair.Pair(key.key, null);
        else
          pair = new Pair.Pair(key, null);
        const prev = YAMLMap.findPair(this.items, pair.key);
        if (!prev)
          this.items.push(pair);
      }
      /**
       * If `keepPair` is `true`, returns the Pair matching `key`.
       * Otherwise, returns the value of that Pair's key.
       */
      get(key, keepPair) {
        const pair = YAMLMap.findPair(this.items, key);
        return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
      }
      set(key, value) {
        if (typeof value !== "boolean")
          throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
        const prev = YAMLMap.findPair(this.items, key);
        if (prev && !value) {
          this.items.splice(this.items.indexOf(prev), 1);
        } else if (!prev && value) {
          this.items.push(new Pair.Pair(key));
        }
      }
      toJSON(_, ctx) {
        return super.toJSON(_, ctx, Set);
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        if (this.hasAllNullValues(true))
          return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
          throw new Error("Set items must all have null values");
      }
      static from(schema, iterable, ctx) {
        const { replacer } = ctx;
        const set2 = new this(schema);
        if (iterable && Symbol.iterator in Object(iterable))
          for (let value of iterable) {
            if (typeof replacer === "function")
              value = replacer.call(iterable, value, value);
            set2.items.push(Pair.createPair(value, null, ctx));
          }
        return set2;
      }
    };
    YAMLSet.tag = "tag:yaml.org,2002:set";
    var set = {
      collection: "map",
      identify: (value) => value instanceof Set,
      nodeClass: YAMLSet,
      default: false,
      tag: "tag:yaml.org,2002:set",
      createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
      resolve(map, onError) {
        if (identity.isMap(map)) {
          if (map.hasAllNullValues(true))
            return Object.assign(new YAMLSet(), map);
          else
            onError("Set items must all have null values");
        } else
          onError("Expected a mapping for this tag");
        return map;
      }
    };
    exports.YAMLSet = YAMLSet;
    exports.set = set;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/timestamp.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    function parseSexagesimal(str2, asBigInt) {
      const sign = str2[0];
      const parts = sign === "-" || sign === "+" ? str2.substring(1) : str2;
      const num = (n) => asBigInt ? BigInt(n) : Number(n);
      const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
      return sign === "-" ? num(-1) * res : res;
    }
    function stringifySexagesimal(node) {
      let { value } = node;
      let num = (n) => n;
      if (typeof value === "bigint")
        num = (n) => BigInt(n);
      else if (isNaN(value) || !isFinite(value))
        return stringifyNumber.stringifyNumber(node);
      let sign = "";
      if (value < 0) {
        sign = "-";
        value *= num(-1);
      }
      const _60 = num(60);
      const parts = [value % _60];
      if (value < 60) {
        parts.unshift(0);
      } else {
        value = (value - parts[0]) / _60;
        parts.unshift(value % _60);
        if (value >= 60) {
          value = (value - parts[0]) / _60;
          parts.unshift(value);
        }
      }
      return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
    }
    var intTime = {
      identify: (value) => typeof value === "bigint" || Number.isInteger(value),
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
      resolve: (str2, _onError, { intAsBigInt }) => parseSexagesimal(str2, intAsBigInt),
      stringify: stringifySexagesimal
    };
    var floatTime = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
      resolve: (str2) => parseSexagesimal(str2, false),
      stringify: stringifySexagesimal
    };
    var timestamp = {
      identify: (value) => value instanceof Date,
      default: true,
      tag: "tag:yaml.org,2002:timestamp",
      // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
      // may be omitted altogether, resulting in a date format. In such a case, the time part is
      // assumed to be 00:00:00Z (start of day, UTC).
      test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
      resolve(str2) {
        const match = str2.match(timestamp.test);
        if (!match)
          throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
        const [, year, month, day, hour, minute, second] = match.map(Number);
        const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
        let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match[8];
        if (tz && tz !== "Z") {
          let d = parseSexagesimal(tz, false);
          if (Math.abs(d) < 30)
            d *= 60;
          date -= 6e4 * d;
        }
        return new Date(date);
      },
      stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
    };
    exports.floatTime = floatTime;
    exports.intTime = intTime;
    exports.timestamp = timestamp;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/yaml-1.1/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var binary = require_binary();
    var bool = require_bool2();
    var float = require_float2();
    var int = require_int2();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var set = require_set();
    var timestamp = require_timestamp();
    var schema = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool.trueTag,
      bool.falseTag,
      int.intBin,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float,
      binary.binary,
      merge.merge,
      omap.omap,
      pairs.pairs,
      set.set,
      timestamp.intTime,
      timestamp.floatTime,
      timestamp.timestamp
    ];
    exports.schema = schema;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/tags.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool = require_bool();
    var float = require_float();
    var int = require_int();
    var schema = require_schema();
    var schema$1 = require_schema2();
    var binary = require_binary();
    var merge = require_merge();
    var omap = require_omap();
    var pairs = require_pairs();
    var schema$2 = require_schema3();
    var set = require_set();
    var timestamp = require_timestamp();
    var schemas = /* @__PURE__ */ new Map([
      ["core", schema.schema],
      ["failsafe", [map.map, seq.seq, string.string]],
      ["json", schema$1.schema],
      ["yaml11", schema$2.schema],
      ["yaml-1.1", schema$2.schema]
    ]);
    var tagsByName = {
      binary: binary.binary,
      bool: bool.boolTag,
      float: float.float,
      floatExp: float.floatExp,
      floatNaN: float.floatNaN,
      floatTime: timestamp.floatTime,
      int: int.int,
      intHex: int.intHex,
      intOct: int.intOct,
      intTime: timestamp.intTime,
      map: map.map,
      merge: merge.merge,
      null: _null.nullTag,
      omap: omap.omap,
      pairs: pairs.pairs,
      seq: seq.seq,
      set: set.set,
      timestamp: timestamp.timestamp
    };
    var coreKnownTags = {
      "tag:yaml.org,2002:binary": binary.binary,
      "tag:yaml.org,2002:merge": merge.merge,
      "tag:yaml.org,2002:omap": omap.omap,
      "tag:yaml.org,2002:pairs": pairs.pairs,
      "tag:yaml.org,2002:set": set.set,
      "tag:yaml.org,2002:timestamp": timestamp.timestamp
    };
    function getTags(customTags, schemaName, addMergeTag) {
      const schemaTags = schemas.get(schemaName);
      if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
      }
      let tags = schemaTags;
      if (!tags) {
        if (Array.isArray(customTags))
          tags = [];
        else {
          const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
      }
      if (Array.isArray(customTags)) {
        for (const tag of customTags)
          tags = tags.concat(tag);
      } else if (typeof customTags === "function") {
        tags = customTags(tags.slice());
      }
      if (addMergeTag)
        tags = tags.concat(merge.merge);
      return tags.reduce((tags2, tag) => {
        const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
        if (!tagObj) {
          const tagName = JSON.stringify(tag);
          const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags2.includes(tagObj))
          tags2.push(tagObj);
        return tags2;
      }, []);
    }
    exports.coreKnownTags = coreKnownTags;
    exports.getTags = getTags;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/schema/Schema.js"(exports) {
    "use strict";
    var identity = require_identity();
    var map = require_map();
    var seq = require_seq();
    var string = require_string();
    var tags = require_tags();
    var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    var Schema = class _Schema {
      constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
        this.name = typeof schema === "string" && schema || "core";
        this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
        this.tags = tags.getTags(customTags, this.name, merge);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, identity.MAP, { value: map.map });
        Object.defineProperty(this, identity.SCALAR, { value: string.string });
        Object.defineProperty(this, identity.SEQ, { value: seq.seq });
        this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
      }
      clone() {
        const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
      }
    };
    exports.Schema = Schema;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/stringify/stringifyDocument.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyDocument(doc, options) {
      const lines = [];
      let hasDirectives = options.directives === true;
      if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
          lines.push(dir);
          hasDirectives = true;
        } else if (doc.directives.docStart)
          hasDirectives = true;
      }
      if (hasDirectives)
        lines.push("---");
      const ctx = stringify.createStringifyContext(doc, options);
      const { commentString } = ctx.options;
      if (doc.commentBefore) {
        if (lines.length !== 1)
          lines.unshift("");
        const cs = commentString(doc.commentBefore);
        lines.unshift(stringifyComment.indentComment(cs, ""));
      }
      let chompKeep = false;
      let contentComment = null;
      if (doc.contents) {
        if (identity.isNode(doc.contents)) {
          if (doc.contents.spaceBefore && hasDirectives)
            lines.push("");
          if (doc.contents.commentBefore) {
            const cs = commentString(doc.contents.commentBefore);
            lines.push(stringifyComment.indentComment(cs, ""));
          }
          ctx.forceBlockIndent = !!doc.comment;
          contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
        let body = stringify.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
        if (contentComment)
          body += stringifyComment.lineComment(body, "", commentString(contentComment));
        if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
          lines[lines.length - 1] = `--- ${body}`;
        } else
          lines.push(body);
      } else {
        lines.push(stringify.stringify(doc.contents, ctx));
      }
      if (doc.directives?.docEnd) {
        if (doc.comment) {
          const cs = commentString(doc.comment);
          if (cs.includes("\n")) {
            lines.push("...");
            lines.push(stringifyComment.indentComment(cs, ""));
          } else {
            lines.push(`... ${cs}`);
          }
        } else {
          lines.push("...");
        }
      } else {
        let dc = doc.comment;
        if (dc && chompKeep)
          dc = dc.replace(/^\n+/, "");
        if (dc) {
          if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
            lines.push("");
          lines.push(stringifyComment.indentComment(commentString(dc), ""));
        }
      }
      return lines.join("\n") + "\n";
    }
    exports.stringifyDocument = stringifyDocument;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/doc/Document.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var toJS = require_toJS();
    var Schema = require_Schema();
    var stringifyDocument = require_stringifyDocument();
    var anchors = require_anchors();
    var applyReviver = require_applyReviver();
    var createNode = require_createNode();
    var directives = require_directives();
    var Document = class _Document {
      constructor(value, replacer, options) {
        this.commentBefore = null;
        this.comment = null;
        this.errors = [];
        this.warnings = [];
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
        let _replacer = null;
        if (typeof replacer === "function" || Array.isArray(replacer)) {
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const opt = Object.assign({
          intAsBigInt: false,
          keepSourceTokens: false,
          logLevel: "warn",
          prettyErrors: true,
          strict: true,
          stringKeys: false,
          uniqueKeys: true,
          version: "1.2"
        }, options);
        this.options = opt;
        let { version } = opt;
        if (options?._directives) {
          this.directives = options._directives.atDocument();
          if (this.directives.yaml.explicit)
            version = this.directives.yaml.version;
        } else
          this.directives = new directives.Directives({ version });
        this.setSchema(version, options);
        this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
      }
      /**
       * Create a deep copy of this Document and its contents.
       *
       * Custom Node values that inherit from `Object` still refer to their original instances.
       */
      clone() {
        const copy = Object.create(_Document.prototype, {
          [identity.NODE_TYPE]: { value: identity.DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
          copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** Adds a value to the document. */
      add(value) {
        if (assertCollection(this.contents))
          this.contents.add(value);
      }
      /** Adds a value to the document. */
      addIn(path14, value) {
        if (assertCollection(this.contents))
          this.contents.addIn(path14, value);
      }
      /**
       * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
       *
       * If `node` already has an anchor, `name` is ignored.
       * Otherwise, the `node.anchor` value will be set to `name`,
       * or if an anchor with that name is already present in the document,
       * `name` will be used as a prefix for a new unique anchor.
       * If `name` is undefined, the generated anchor will use 'a' as a prefix.
       */
      createAlias(node, name) {
        if (!node.anchor) {
          const prev = anchors.anchorNames(this);
          node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
        }
        return new Alias.Alias(node.anchor);
      }
      createNode(value, replacer, options) {
        let _replacer = void 0;
        if (typeof replacer === "function") {
          value = replacer.call({ "": value }, "", value);
          _replacer = replacer;
        } else if (Array.isArray(replacer)) {
          const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
          const asStr = replacer.filter(keyToStr).map(String);
          if (asStr.length > 0)
            replacer = replacer.concat(asStr);
          _replacer = replacer;
        } else if (options === void 0 && replacer) {
          options = replacer;
          replacer = void 0;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
          this,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          anchorPrefix || "a"
        );
        const ctx = {
          aliasDuplicateObjects: aliasDuplicateObjects ?? true,
          keepUndefined: keepUndefined ?? false,
          onAnchor,
          onTagObj,
          replacer: _replacer,
          schema: this.schema,
          sourceObjects
        };
        const node = createNode.createNode(value, tag, ctx);
        if (flow && identity.isCollection(node))
          node.flow = true;
        setAnchors();
        return node;
      }
      /**
       * Convert a key and a value into a `Pair` using the current schema,
       * recursively wrapping all values as `Scalar` or `Collection` nodes.
       */
      createPair(key, value, options = {}) {
        const k = this.createNode(key, null, options);
        const v = this.createNode(value, null, options);
        return new Pair.Pair(k, v);
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        return assertCollection(this.contents) ? this.contents.delete(key) : false;
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path14) {
        if (Collection.isEmptyPath(path14)) {
          if (this.contents == null)
            return false;
          this.contents = null;
          return true;
        }
        return assertCollection(this.contents) ? this.contents.deleteIn(path14) : false;
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      get(key, keepScalar) {
        return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
      }
      /**
       * Returns item at `path`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path14, keepScalar) {
        if (Collection.isEmptyPath(path14))
          return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
        return identity.isCollection(this.contents) ? this.contents.getIn(path14, keepScalar) : void 0;
      }
      /**
       * Checks if the document includes a value with the key `key`.
       */
      has(key) {
        return identity.isCollection(this.contents) ? this.contents.has(key) : false;
      }
      /**
       * Checks if the document includes a value at `path`.
       */
      hasIn(path14) {
        if (Collection.isEmptyPath(path14))
          return this.contents !== void 0;
        return identity.isCollection(this.contents) ? this.contents.hasIn(path14) : false;
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      set(key, value) {
        if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, [key], value);
        } else if (assertCollection(this.contents)) {
          this.contents.set(key, value);
        }
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path14, value) {
        if (Collection.isEmptyPath(path14)) {
          this.contents = value;
        } else if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, Array.from(path14), value);
        } else if (assertCollection(this.contents)) {
          this.contents.setIn(path14, value);
        }
      }
      /**
       * Change the YAML version and schema used by the document.
       * A `null` version disables support for directives, explicit tags, anchors, and aliases.
       * It also requires the `schema` option to be given as a `Schema` instance value.
       *
       * Overrides all previously set schema options.
       */
      setSchema(version, options = {}) {
        if (typeof version === "number")
          version = String(version);
        let opt;
        switch (version) {
          case "1.1":
            if (this.directives)
              this.directives.yaml.version = "1.1";
            else
              this.directives = new directives.Directives({ version: "1.1" });
            opt = { resolveKnownTags: false, schema: "yaml-1.1" };
            break;
          case "1.2":
          case "next":
            if (this.directives)
              this.directives.yaml.version = version;
            else
              this.directives = new directives.Directives({ version });
            opt = { resolveKnownTags: true, schema: "core" };
            break;
          case null:
            if (this.directives)
              delete this.directives;
            opt = null;
            break;
          default: {
            const sv = JSON.stringify(version);
            throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
          }
        }
        if (options.schema instanceof Object)
          this.schema = options.schema;
        else if (opt)
          this.schema = new Schema.Schema(Object.assign(opt, options));
        else
          throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
      }
      // json & jsonArg are only used from toJSON()
      toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc: this,
          keep: !json,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
      }
      /**
       * A JSON representation of the document `contents`.
       *
       * @param jsonArg Used by `JSON.stringify` to indicate the array index or
       *   property name.
       */
      toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
      }
      /** A YAML representation of the document. */
      toString(options = {}) {
        if (this.errors.length > 0)
          throw new Error("Document with errors cannot be stringified");
        if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
          const s = JSON.stringify(options.indent);
          throw new Error(`"indent" option must be a positive integer, not ${s}`);
        }
        return stringifyDocument.stringifyDocument(this, options);
      }
    };
    function assertCollection(contents) {
      if (identity.isCollection(contents))
        return true;
      throw new Error("Expected a YAML collection as document contents");
    }
    exports.Document = Document;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/errors.js
var require_errors = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/errors.js"(exports) {
    "use strict";
    var YAMLError = class extends Error {
      constructor(name, pos, code, message) {
        super();
        this.name = name;
        this.code = code;
        this.message = message;
        this.pos = pos;
      }
    };
    var YAMLParseError = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLParseError", pos, code, message);
      }
    };
    var YAMLWarning = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLWarning", pos, code, message);
      }
    };
    var prettifyError = (src, lc) => (error) => {
      if (error.pos[0] === -1)
        return;
      error.linePos = error.pos.map((pos) => lc.linePos(pos));
      const { line, col } = error.linePos[0];
      error.message += ` at line ${line}, column ${col}`;
      let ci = col - 1;
      let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
      if (ci >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci - 39, lineStr.length - 79);
        lineStr = "\u2026" + lineStr.substring(trimStart);
        ci -= trimStart - 1;
      }
      if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + "\u2026";
      if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
        let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
        if (prev.length > 80)
          prev = prev.substring(0, 79) + "\u2026\n";
        lineStr = prev + lineStr;
      }
      if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end = error.linePos[1];
        if (end?.line === line && end.col > col) {
          count = Math.max(1, Math.min(end.col - col, 80 - ci));
        }
        const pointer = " ".repeat(ci) + "^".repeat(count);
        error.message += `:

${lineStr}
${pointer}
`;
      }
    };
    exports.YAMLError = YAMLError;
    exports.YAMLParseError = YAMLParseError;
    exports.YAMLWarning = YAMLWarning;
    exports.prettifyError = prettifyError;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-props.js"(exports) {
    "use strict";
    function resolveProps(tokens2, { flow, indicator, next, offset: offset2, onError, parentIndent, startOnNewline }) {
      let spaceBefore = false;
      let atNewline = startOnNewline;
      let hasSpace = startOnNewline;
      let comment = "";
      let commentSep = "";
      let hasNewline = false;
      let reqSpace = false;
      let tab = null;
      let anchor = null;
      let tag = null;
      let newlineAfterProp = null;
      let comma = null;
      let found = null;
      let start = null;
      for (const token of tokens2) {
        if (reqSpace) {
          if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
            onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
          reqSpace = false;
        }
        if (tab) {
          if (atNewline && token.type !== "comment" && token.type !== "newline") {
            onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
          }
          tab = null;
        }
        switch (token.type) {
          case "space":
            if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) {
              tab = token;
            }
            hasSpace = true;
            break;
          case "comment": {
            if (!hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = token.source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += commentSep + cb;
            commentSep = "";
            atNewline = false;
            break;
          }
          case "newline":
            if (atNewline) {
              if (comment)
                comment += token.source;
              else if (!found || indicator !== "seq-item-ind")
                spaceBefore = true;
            } else
              commentSep += token.source;
            atNewline = true;
            hasNewline = true;
            if (anchor || tag)
              newlineAfterProp = token;
            hasSpace = true;
            break;
          case "anchor":
            if (anchor)
              onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
            if (token.source.endsWith(":"))
              onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
            anchor = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          case "tag": {
            if (tag)
              onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
            tag = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          }
          case indicator:
            if (anchor || tag)
              onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
            if (found)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
            found = token;
            atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
            hasSpace = false;
            break;
          case "comma":
            if (flow) {
              if (comma)
                onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
              comma = token;
              atNewline = false;
              hasSpace = false;
              break;
            }
          // else fallthrough
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
            atNewline = false;
            hasSpace = false;
        }
      }
      const last = tokens2[tokens2.length - 1];
      const end = last ? last.offset + last.source.length : offset2;
      if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
        onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      }
      if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor,
        tag,
        newlineAfterProp,
        end,
        start: start ?? end
      };
    }
    exports.resolveProps = resolveProps;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-contains-newline.js"(exports) {
    "use strict";
    function containsNewline(key) {
      if (!key)
        return null;
      switch (key.type) {
        case "alias":
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          if (key.source.includes("\n"))
            return true;
          if (key.end) {
            for (const st of key.end)
              if (st.type === "newline")
                return true;
          }
          return false;
        case "flow-collection":
          for (const it of key.items) {
            for (const st of it.start)
              if (st.type === "newline")
                return true;
            if (it.sep) {
              for (const st of it.sep)
                if (st.type === "newline")
                  return true;
            }
            if (containsNewline(it.key) || containsNewline(it.value))
              return true;
          }
          return false;
        default:
          return true;
      }
    }
    exports.containsNewline = containsNewline;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-flow-indent-check.js"(exports) {
    "use strict";
    var utilContainsNewline = require_util_contains_newline();
    function flowIndentCheck(indent, fc, onError) {
      if (fc?.type === "flow-collection") {
        const end = fc.end[0];
        if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
          const msg = "Flow end indicator should be more indented than parent";
          onError(end, "BAD_INDENT", msg, true);
        }
      }
    }
    exports.flowIndentCheck = flowIndentCheck;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-map-includes.js"(exports) {
    "use strict";
    var identity = require_identity();
    function mapIncludes(ctx, items, search) {
      const { uniqueKeys } = ctx.options;
      if (uniqueKeys === false)
        return false;
      const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
      return items.some((pair) => isEqual(pair.key, search));
    }
    exports.mapIncludes = mapIncludes;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-block-map.js"(exports) {
    "use strict";
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    var utilMapIncludes = require_util_map_includes();
    var startColMsg = "All mapping items must start at the same column";
    function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
      const map = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      let offset2 = bm.offset;
      let commentEnd = null;
      for (const collItem of bm.items) {
        const { start, key, sep, value } = collItem;
        const keyProps = resolveProps.resolveProps(start, {
          indicator: "explicit-key-ind",
          next: key ?? sep?.[0],
          offset: offset2,
          onError,
          parentIndent: bm.indent,
          startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
          if (key) {
            if (key.type === "block-seq")
              onError(offset2, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
            else if ("indent" in key && key.indent !== bm.indent)
              onError(offset2, "BAD_INDENT", startColMsg);
          }
          if (!keyProps.anchor && !keyProps.tag && !sep) {
            commentEnd = keyProps.end;
            if (keyProps.comment) {
              if (map.comment)
                map.comment += "\n" + keyProps.comment;
              else
                map.comment = keyProps.comment;
            }
            continue;
          }
          if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
            onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
          }
        } else if (keyProps.found?.indent !== bm.indent) {
          onError(offset2, "BAD_INDENT", startColMsg);
        }
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
        ctx.atKey = false;
        if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        const valueProps = resolveProps.resolveProps(sep ?? [], {
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: bm.indent,
          startOnNewline: !key || key.type === "block-scalar"
        });
        offset2 = valueProps.end;
        if (valueProps.found) {
          if (implicitKey) {
            if (value?.type === "block-map" && !valueProps.hasNewline)
              onError(offset2, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
            if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
              onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset2, sep, null, valueProps, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
          offset2 = valueNode.range[2];
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        } else {
          if (implicitKey)
            onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
          if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        }
      }
      if (commentEnd && commentEnd < offset2)
        onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
      map.range = [bm.offset, offset2, commentEnd ?? offset2];
      return map;
    }
    exports.resolveBlockMap = resolveBlockMap;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-block-seq.js"(exports) {
    "use strict";
    var YAMLSeq = require_YAMLSeq();
    var resolveProps = require_resolve_props();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
      const seq = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset2 = bs.offset;
      let commentEnd = null;
      for (const { start, value } of bs.items) {
        const props = resolveProps.resolveProps(start, {
          indicator: "seq-item-ind",
          next: value,
          offset: offset2,
          onError,
          parentIndent: bs.indent,
          startOnNewline: true
        });
        if (!props.found) {
          if (props.anchor || props.tag || value) {
            if (value?.type === "block-seq")
              onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
            else
              onError(offset2, "MISSING_CHAR", "Sequence item without - indicator");
          } else {
            commentEnd = props.end;
            if (props.comment)
              seq.comment = props.comment;
            continue;
          }
        }
        const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
        offset2 = node.range[2];
        seq.items.push(node);
      }
      seq.range = [bs.offset, offset2, commentEnd ?? offset2];
      return seq;
    }
    exports.resolveBlockSeq = resolveBlockSeq;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-end.js"(exports) {
    "use strict";
    function resolveEnd(end, offset2, reqSpace, onError) {
      let comment = "";
      if (end) {
        let hasSpace = false;
        let sep = "";
        for (const token of end) {
          const { source, type } = token;
          switch (type) {
            case "space":
              hasSpace = true;
              break;
            case "comment": {
              if (reqSpace && !hasSpace)
                onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
              const cb = source.substring(1) || " ";
              if (!comment)
                comment = cb;
              else
                comment += sep + cb;
              sep = "";
              break;
            }
            case "newline":
              if (comment)
                sep += source;
              hasSpace = true;
              break;
            default:
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
          }
          offset2 += source.length;
        }
      }
      return { comment, offset: offset2 };
    }
    exports.resolveEnd = resolveEnd;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-flow-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilMapIncludes = require_util_map_includes();
    var blockMsg = "Block collections are not allowed within flow collections";
    var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
    function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
      const isMap = fc.start.source === "{";
      const fcName = isMap ? "flow map" : "flow sequence";
      const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
      const coll = new NodeClass(ctx.schema);
      coll.flow = true;
      const atRoot = ctx.atRoot;
      if (atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset2 = fc.offset + fc.start.source.length;
      for (let i = 0; i < fc.items.length; ++i) {
        const collItem = fc.items[i];
        const { start, key, sep, value } = collItem;
        const props = resolveProps.resolveProps(start, {
          flow: fcName,
          indicator: "explicit-key-ind",
          next: key ?? sep?.[0],
          offset: offset2,
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (!props.found) {
          if (!props.anchor && !props.tag && !sep && !value) {
            if (i === 0 && props.comma)
              onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
            else if (i < fc.items.length - 1)
              onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
            if (props.comment) {
              if (coll.comment)
                coll.comment += "\n" + props.comment;
              else
                coll.comment = props.comment;
            }
            offset2 = props.end;
            continue;
          }
          if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
            onError(
              key,
              // checked by containsNewline()
              "MULTILINE_IMPLICIT_KEY",
              "Implicit keys of flow sequence pairs need to be on a single line"
            );
        }
        if (i === 0) {
          if (props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        } else {
          if (!props.comma)
            onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
          if (props.comment) {
            let prevItemComment = "";
            loop: for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
            if (prevItemComment) {
              let prev = coll.items[coll.items.length - 1];
              if (identity.isPair(prev))
                prev = prev.value ?? prev.key;
              if (prev.comment)
                prev.comment += "\n" + prevItemComment;
              else
                prev.comment = prevItemComment;
              props.comment = props.comment.substring(prevItemComment.length + 1);
            }
          }
        }
        if (!isMap && !sep && !props.found) {
          const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep, null, props, onError);
          coll.items.push(valueNode);
          offset2 = valueNode.range[2];
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else {
          ctx.atKey = true;
          const keyStart = props.end;
          const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
          if (isBlock(key))
            onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
          ctx.atKey = false;
          const valueProps = resolveProps.resolveProps(sep ?? [], {
            flow: fcName,
            indicator: "map-value-ind",
            next: value,
            offset: keyNode.range[2],
            onError,
            parentIndent: fc.indent,
            startOnNewline: false
          });
          if (valueProps.found) {
            if (!isMap && !props.found && ctx.options.strict) {
              if (sep)
                for (const st of sep) {
                  if (st === valueProps.found)
                    break;
                  if (st.type === "newline") {
                    onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                    break;
                  }
                }
              if (props.start < valueProps.found.offset - 1024)
                onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
            }
          } else if (value) {
            if ("source" in value && value.source?.[0] === ":")
              onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
            else
              onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError) : null;
          if (valueNode) {
            if (isBlock(value))
              onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
          } else if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          if (isMap) {
            const map = coll;
            if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
              onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
            map.items.push(pair);
          } else {
            const map = new YAMLMap.YAMLMap(ctx.schema);
            map.flow = true;
            map.items.push(pair);
            const endRange = (valueNode ?? keyNode).range;
            map.range = [keyNode.range[0], endRange[1], endRange[2]];
            coll.items.push(map);
          }
          offset2 = valueNode ? valueNode.range[2] : valueProps.end;
        }
      }
      const expectedEnd = isMap ? "}" : "]";
      const [ce, ...ee] = fc.end;
      let cePos = offset2;
      if (ce?.source === expectedEnd)
        cePos = ce.offset + ce.source.length;
      else {
        const name = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset2, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
        if (ce && ce.source.length !== 1)
          ee.unshift(ce);
      }
      if (ee.length > 0) {
        const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
        if (end.comment) {
          if (coll.comment)
            coll.comment += "\n" + end.comment;
          else
            coll.comment = end.comment;
        }
        coll.range = [fc.offset, cePos, end.offset];
      } else {
        coll.range = [fc.offset, cePos, cePos];
      }
      return coll;
    }
    exports.resolveFlowCollection = resolveFlowCollection;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveBlockMap = require_resolve_block_map();
    var resolveBlockSeq = require_resolve_block_seq();
    var resolveFlowCollection = require_resolve_flow_collection();
    function resolveCollection(CN, ctx, token, onError, tagName, tag) {
      const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
      const Coll = coll.constructor;
      if (tagName === "!" || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
      }
      if (tagName)
        coll.tag = tagName;
      return coll;
    }
    function composeCollection(CN, ctx, token, props, onError) {
      const tagToken = props.tag;
      const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
      if (token.type === "block-seq") {
        const { anchor, newlineAfterProp: nl } = props;
        const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
          const message = "Missing newline after block sequence props";
          onError(lastProp, "MISSING_CHAR", message);
        }
      }
      const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
      if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
      let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
      if (!tag) {
        const kt = ctx.schema.knownTags[tagName];
        if (kt?.collection === expType) {
          ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
          tag = kt;
        } else {
          if (kt) {
            onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
          } else {
            onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
          }
          return resolveCollection(CN, ctx, token, onError, tagName);
        }
      }
      const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
      const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
      const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
      node.range = coll.range;
      node.tag = tagName;
      if (tag?.format)
        node.format = tag.format;
      return node;
    }
    exports.composeCollection = composeCollection;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-block-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function resolveBlockScalar(ctx, scalar, onError) {
      const start = scalar.offset;
      const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
      if (!header)
        return { value: "", type: null, comment: "", range: [start, start, start] };
      const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
      const lines = scalar.source ? splitLines(scalar.source) : [];
      let chompStart = lines.length;
      for (let i = lines.length - 1; i >= 0; --i) {
        const content = lines[i][1];
        if (content === "" || content === "\r")
          chompStart = i;
        else
          break;
      }
      if (chompStart === 0) {
        const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
        let end2 = start + header.length;
        if (scalar.source)
          end2 += scalar.source.length;
        return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
      }
      let trimIndent = scalar.indent + header.indent;
      let offset2 = scalar.offset + header.length;
      let contentStart = 0;
      for (let i = 0; i < chompStart; ++i) {
        const [indent, content] = lines[i];
        if (content === "" || content === "\r") {
          if (header.indent === 0 && indent.length > trimIndent)
            trimIndent = indent.length;
        } else {
          if (indent.length < trimIndent) {
            const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
            onError(offset2 + indent.length, "MISSING_CHAR", message);
          }
          if (header.indent === 0)
            trimIndent = indent.length;
          contentStart = i;
          if (trimIndent === 0 && !ctx.atRoot) {
            const message = "Block scalar values in collections must be indented";
            onError(offset2, "BAD_INDENT", message);
          }
          break;
        }
        offset2 += indent.length + content.length + 1;
      }
      for (let i = lines.length - 1; i >= chompStart; --i) {
        if (lines[i][0].length > trimIndent)
          chompStart = i + 1;
      }
      let value = "";
      let sep = "";
      let prevMoreIndented = false;
      for (let i = 0; i < contentStart; ++i)
        value += lines[i][0].slice(trimIndent) + "\n";
      for (let i = contentStart; i < chompStart; ++i) {
        let [indent, content] = lines[i];
        offset2 += indent.length + content.length + 1;
        const crlf = content[content.length - 1] === "\r";
        if (crlf)
          content = content.slice(0, -1);
        if (content && indent.length < trimIndent) {
          const src = header.indent ? "explicit indentation indicator" : "first line";
          const message = `Block scalar lines must not be less indented than their ${src}`;
          onError(offset2 - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
          indent = "";
        }
        if (type === Scalar.Scalar.BLOCK_LITERAL) {
          value += sep + indent.slice(trimIndent) + content;
          sep = "\n";
        } else if (indent.length > trimIndent || content[0] === "	") {
          if (sep === " ")
            sep = "\n";
          else if (!prevMoreIndented && sep === "\n")
            sep = "\n\n";
          value += sep + indent.slice(trimIndent) + content;
          sep = "\n";
          prevMoreIndented = true;
        } else if (content === "") {
          if (sep === "\n")
            value += "\n";
          else
            sep = "\n";
        } else {
          value += sep + content;
          sep = " ";
          prevMoreIndented = false;
        }
      }
      switch (header.chomp) {
        case "-":
          break;
        case "+":
          for (let i = chompStart; i < lines.length; ++i)
            value += "\n" + lines[i][0].slice(trimIndent);
          if (value[value.length - 1] !== "\n")
            value += "\n";
          break;
        default:
          value += "\n";
      }
      const end = start + header.length + scalar.source.length;
      return { value, type, comment: header.comment, range: [start, end, end] };
    }
    function parseBlockScalarHeader({ offset: offset2, props }, strict, onError) {
      if (props[0].type !== "block-scalar-header") {
        onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
        return null;
      }
      const { source } = props[0];
      const mode = source[0];
      let indent = 0;
      let chomp = "";
      let error = -1;
      for (let i = 1; i < source.length; ++i) {
        const ch = source[i];
        if (!chomp && (ch === "-" || ch === "+"))
          chomp = ch;
        else {
          const n = Number(ch);
          if (!indent && n)
            indent = n;
          else if (error === -1)
            error = offset2 + i;
        }
      }
      if (error !== -1)
        onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
      let hasSpace = false;
      let comment = "";
      let length = source.length;
      for (let i = 1; i < props.length; ++i) {
        const token = props[i];
        switch (token.type) {
          case "space":
            hasSpace = true;
          // fallthrough
          case "newline":
            length += token.source.length;
            break;
          case "comment":
            if (strict && !hasSpace) {
              const message = "Comments must be separated from other tokens by white space characters";
              onError(token, "MISSING_CHAR", message);
            }
            length += token.source.length;
            comment = token.source.substring(1);
            break;
          case "error":
            onError(token, "UNEXPECTED_TOKEN", token.message);
            length += token.source.length;
            break;
          /* istanbul ignore next should not happen */
          default: {
            const message = `Unexpected token in block scalar header: ${token.type}`;
            onError(token, "UNEXPECTED_TOKEN", message);
            const ts = token.source;
            if (ts && typeof ts === "string")
              length += ts.length;
          }
        }
      }
      return { mode, indent, chomp, comment, length };
    }
    function splitLines(source) {
      const split = source.split(/\n( *)/);
      const first = split[0];
      const m = first.match(/^( *)/);
      const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
      const lines = [line0];
      for (let i = 1; i < split.length; i += 2)
        lines.push([split[i], split[i + 1]]);
      return lines;
    }
    exports.resolveBlockScalar = resolveBlockScalar;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/resolve-flow-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var resolveEnd = require_resolve_end();
    function resolveFlowScalar(scalar, strict, onError) {
      const { offset: offset2, type, source, end } = scalar;
      let _type;
      let value;
      const _onError = (rel, code, msg) => onError(offset2 + rel, code, msg);
      switch (type) {
        case "scalar":
          _type = Scalar.Scalar.PLAIN;
          value = plainValue(source, _onError);
          break;
        case "single-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_SINGLE;
          value = singleQuotedValue(source, _onError);
          break;
        case "double-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_DOUBLE;
          value = doubleQuotedValue(source, _onError);
          break;
        /* istanbul ignore next should not happen */
        default:
          onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
          return {
            value: "",
            type: null,
            comment: "",
            range: [offset2, offset2 + source.length, offset2 + source.length]
          };
      }
      const valueEnd = offset2 + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
      return {
        value,
        type: _type,
        comment: re.comment,
        range: [offset2, valueEnd, re.offset]
      };
    }
    function plainValue(source, onError) {
      let badChar = "";
      switch (source[0]) {
        /* istanbul ignore next should not happen */
        case "	":
          badChar = "a tab character";
          break;
        case ",":
          badChar = "flow indicator character ,";
          break;
        case "%":
          badChar = "directive indicator character %";
          break;
        case "|":
        case ">": {
          badChar = `block scalar indicator ${source[0]}`;
          break;
        }
        case "@":
        case "`": {
          badChar = `reserved character ${source[0]}`;
          break;
        }
      }
      if (badChar)
        onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
      return unfoldLines(source);
    }
    function singleQuotedValue(source, onError) {
      if (source[source.length - 1] !== "'" || source.length === 1)
        onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
      return unfoldLines(source.slice(1, -1)).replace(/''/g, "'");
    }
    function unfoldLines(source) {
      const line = /(.*?)\r?\n/sy;
      let match = line.exec(source);
      if (!match)
        return source;
      let trimEnd, trimBoth;
      try {
        trimEnd = new RegExp("(?<![ 	])[ 	]+$");
        trimBoth = new RegExp("^[ 	]+|(?<![ 	])[ 	]+$", "g");
      } catch {
        trimEnd = /[ \t]+$/;
        trimBoth = /^[ \t]+|[ \t]+$/g;
      }
      let res = match[1].replace(trimEnd, "");
      let sep = " ";
      let pos = line.lastIndex;
      while (match = line.exec(source)) {
        const lm = match[1].replace(trimBoth, "");
        if (lm === "") {
          if (sep === "\n")
            res += sep;
          else
            sep = "\n";
        } else {
          res += sep + lm;
          sep = " ";
        }
        pos = line.lastIndex;
      }
      const last = /[ \t]*(.*)/sy;
      last.lastIndex = pos;
      match = last.exec(source);
      return res + sep + (match?.[1] ?? "");
    }
    function doubleQuotedValue(source, onError) {
      let res = "";
      for (let i = 1; i < source.length - 1; ++i) {
        const ch = source[i];
        if (ch === "\r" && source[i + 1] === "\n")
          continue;
        if (ch === "\n") {
          const { fold, offset: offset2 } = foldNewline(source, i);
          res += fold;
          i = offset2;
        } else if (ch === "\\") {
          let next = source[++i];
          const cc = escapeCodes[next];
          if (cc)
            res += cc;
          else if (next === "\n") {
            next = source[i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "\r" && source[i + 1] === "\n") {
            next = source[++i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "x" || next === "u" || next === "U") {
            const length = next === "x" ? 2 : next === "u" ? 4 : 8;
            res += parseCharCode(source, i + 1, length, onError);
            i += length;
          } else {
            const raw = source.substr(i - 1, 2);
            onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
            res += raw;
          }
        } else if (ch === " " || ch === "	") {
          const wsStart = i;
          let next = source[i + 1];
          while (next === " " || next === "	")
            next = source[++i + 1];
          if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
            res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
        } else {
          res += ch;
        }
      }
      if (source[source.length - 1] !== '"' || source.length === 1)
        onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
      return res;
    }
    function foldNewline(source, offset2) {
      let fold = "";
      let ch = source[offset2 + 1];
      while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
        if (ch === "\r" && source[offset2 + 2] !== "\n")
          break;
        if (ch === "\n")
          fold += "\n";
        offset2 += 1;
        ch = source[offset2 + 1];
      }
      if (!fold)
        fold = " ";
      return { fold, offset: offset2 };
    }
    var escapeCodes = {
      "0": "\0",
      // null character
      a: "\x07",
      // bell character
      b: "\b",
      // backspace
      e: "\x1B",
      // escape character
      f: "\f",
      // form feed
      n: "\n",
      // line feed
      r: "\r",
      // carriage return
      t: "	",
      // horizontal tab
      v: "\v",
      // vertical tab
      N: "\x85",
      // Unicode next line
      _: "\xA0",
      // Unicode non-breaking space
      L: "\u2028",
      // Unicode line separator
      P: "\u2029",
      // Unicode paragraph separator
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      "	": "	"
    };
    function parseCharCode(source, offset2, length, onError) {
      const cc = source.substr(offset2, length);
      const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
      const code = ok ? parseInt(cc, 16) : NaN;
      try {
        return String.fromCodePoint(code);
      } catch {
        const raw = source.substr(offset2 - 2, length + 2);
        onError(offset2 - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        return raw;
      }
    }
    exports.resolveFlowScalar = resolveFlowScalar;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    function composeScalar(ctx, token, tagToken, onError) {
      const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
      const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
      let tag;
      if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[identity.SCALAR];
      } else if (tagName)
        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
      else if (token.type === "scalar")
        tag = findScalarTagByTest(ctx, value, token, onError);
      else
        tag = ctx.schema[identity.SCALAR];
      let scalar;
      try {
        const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
        scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
        scalar = new Scalar.Scalar(value);
      }
      scalar.range = range;
      scalar.source = value;
      if (type)
        scalar.type = type;
      if (tagName)
        scalar.tag = tagName;
      if (tag.format)
        scalar.format = tag.format;
      if (comment)
        scalar.comment = comment;
      return scalar;
    }
    function findScalarTagByName(schema, value, tagName, tagToken, onError) {
      if (tagName === "!")
        return schema[identity.SCALAR];
      const matchWithTest = [];
      for (const tag of schema.tags) {
        if (!tag.collection && tag.tag === tagName) {
          if (tag.default && tag.test)
            matchWithTest.push(tag);
          else
            return tag;
        }
      }
      for (const tag of matchWithTest)
        if (tag.test?.test(value))
          return tag;
      const kt = schema.knownTags[tagName];
      if (kt && !kt.collection) {
        schema.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
        return kt;
      }
      onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
      return schema[identity.SCALAR];
    }
    function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
      const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema[identity.SCALAR];
      if (schema.compat) {
        const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema[identity.SCALAR];
        if (tag.tag !== compat.tag) {
          const ts = directives.tagString(tag.tag);
          const cs = directives.tagString(compat.tag);
          const msg = `Value may be parsed as either ${ts} or ${cs}`;
          onError(token, "TAG_RESOLVE_FAILED", msg, true);
        }
      }
      return tag;
    }
    exports.composeScalar = composeScalar;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/util-empty-scalar-position.js"(exports) {
    "use strict";
    function emptyScalarPosition(offset2, before, pos) {
      if (before) {
        pos ?? (pos = before.length);
        for (let i = pos - 1; i >= 0; --i) {
          let st = before[i];
          switch (st.type) {
            case "space":
            case "comment":
            case "newline":
              offset2 -= st.source.length;
              continue;
          }
          st = before[++i];
          while (st?.type === "space") {
            offset2 += st.source.length;
            st = before[++i];
          }
          break;
        }
      }
      return offset2;
    }
    exports.emptyScalarPosition = emptyScalarPosition;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-node.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var composeCollection = require_compose_collection();
    var composeScalar = require_compose_scalar();
    var resolveEnd = require_resolve_end();
    var utilEmptyScalarPosition = require_util_empty_scalar_position();
    var CN = { composeNode, composeEmptyNode };
    function composeNode(ctx, token, props, onError) {
      const atKey = ctx.atKey;
      const { spaceBefore, comment, anchor, tag } = props;
      let node;
      let isSrcToken = true;
      switch (token.type) {
        case "alias":
          node = composeAlias(ctx, token, onError);
          if (anchor || tag)
            onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
          break;
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "block-scalar":
          node = composeScalar.composeScalar(ctx, token, tag, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
          break;
        case "block-map":
        case "block-seq":
        case "flow-collection":
          try {
            node = composeCollection.composeCollection(CN, ctx, token, props, onError);
            if (anchor)
              node.anchor = anchor.source.substring(1);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            onError(token, "RESOURCE_EXHAUSTION", message);
          }
          break;
        default: {
          const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
          onError(token, "UNEXPECTED_TOKEN", message);
          isSrcToken = false;
        }
      }
      node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
      if (anchor && node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
        const msg = "With stringKeys, all keys must be strings";
        onError(tag ?? token, "NON_STRING_KEY", msg);
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        if (token.type === "scalar" && token.source === "")
          node.comment = comment;
        else
          node.commentBefore = comment;
      }
      if (ctx.options.keepSourceTokens && isSrcToken)
        node.srcToken = token;
      return node;
    }
    function composeEmptyNode(ctx, offset2, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
      const token = {
        type: "scalar",
        offset: utilEmptyScalarPosition.emptyScalarPosition(offset2, before, pos),
        indent: -1,
        source: ""
      };
      const node = composeScalar.composeScalar(ctx, token, tag, onError);
      if (anchor) {
        node.anchor = anchor.source.substring(1);
        if (node.anchor === "")
          onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        node.comment = comment;
        node.range[2] = end;
      }
      return node;
    }
    function composeAlias({ options }, { offset: offset2, source, end }, onError) {
      const alias = new Alias.Alias(source.substring(1));
      if (alias.source === "")
        onError(offset2, "BAD_ALIAS", "Alias cannot be an empty string");
      if (alias.source.endsWith(":"))
        onError(offset2 + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
      const valueEnd = offset2 + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
      alias.range = [offset2, valueEnd, re.offset];
      if (re.comment)
        alias.comment = re.comment;
      return alias;
    }
    exports.composeEmptyNode = composeEmptyNode;
    exports.composeNode = composeNode;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/compose-doc.js"(exports) {
    "use strict";
    var Document = require_Document();
    var composeNode = require_compose_node();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    function composeDoc(options, directives, { offset: offset2, start, value, end }, onError) {
      const opts = Object.assign({ _directives: directives }, options);
      const doc = new Document.Document(void 0, opts);
      const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
      };
      const props = resolveProps.resolveProps(start, {
        indicator: "doc-start",
        next: value ?? end?.[0],
        offset: offset2,
        onError,
        parentIndent: 0,
        startOnNewline: true
      });
      if (props.found) {
        doc.directives.docStart = true;
        if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
          onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
      }
      doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
      const contentEnd = doc.contents.range[2];
      const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
      if (re.comment)
        doc.comment = re.comment;
      doc.range = [offset2, contentEnd, re.offset];
      return doc;
    }
    exports.composeDoc = composeDoc;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/compose/composer.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var directives = require_directives();
    var Document = require_Document();
    var errors = require_errors();
    var identity = require_identity();
    var composeDoc = require_compose_doc();
    var resolveEnd = require_resolve_end();
    function getErrorPos(src) {
      if (typeof src === "number")
        return [src, src + 1];
      if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
      const { offset: offset2, source } = src;
      return [offset2, offset2 + (typeof source === "string" ? source.length : 1)];
    }
    function parsePrelude(prelude) {
      let comment = "";
      let atComment = false;
      let afterEmptyLine = false;
      for (let i = 0; i < prelude.length; ++i) {
        const source = prelude[i];
        switch (source[0]) {
          case "#":
            comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
            atComment = true;
            afterEmptyLine = false;
            break;
          case "%":
            if (prelude[i + 1]?.[0] !== "#")
              i += 1;
            atComment = false;
            break;
          default:
            if (!atComment)
              afterEmptyLine = true;
            atComment = false;
        }
      }
      return { comment, afterEmptyLine };
    }
    var Composer = class {
      constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source, code, message, warning) => {
          const pos = getErrorPos(source);
          if (warning)
            this.warnings.push(new errors.YAMLWarning(pos, code, message));
          else
            this.errors.push(new errors.YAMLParseError(pos, code, message));
        };
        this.directives = new directives.Directives({ version: options.version || "1.2" });
        this.options = options;
      }
      decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        if (comment) {
          const dc = doc.contents;
          if (afterDoc) {
            doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
          } else if (afterEmptyLine || doc.directives.docStart || !dc) {
            doc.commentBefore = comment;
          } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
            let it = dc.items[0];
            if (identity.isPair(it))
              it = it.key;
            const cb = it.commentBefore;
            it.commentBefore = cb ? `${comment}
${cb}` : comment;
          } else {
            const cb = dc.commentBefore;
            dc.commentBefore = cb ? `${comment}
${cb}` : comment;
          }
        }
        if (afterDoc) {
          for (let i = 0; i < this.errors.length; ++i)
            doc.errors.push(this.errors[i]);
          for (let i = 0; i < this.warnings.length; ++i)
            doc.warnings.push(this.warnings[i]);
        } else {
          doc.errors = this.errors;
          doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
      }
      /**
       * Current stream status information.
       *
       * Mostly useful at the end of input for an empty stream.
       */
      streamInfo() {
        return {
          comment: parsePrelude(this.prelude).comment,
          directives: this.directives,
          errors: this.errors,
          warnings: this.warnings
        };
      }
      /**
       * Compose tokens into documents.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *compose(tokens2, forceDoc = false, endOffset = -1) {
        for (const token of tokens2)
          yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
      }
      /** Advance the composer by one CST token. */
      *next(token) {
        if (node_process.env.LOG_STREAM)
          console.dir(token, { depth: null });
        switch (token.type) {
          case "directive":
            this.directives.add(token.source, (offset2, message, warning) => {
              const pos = getErrorPos(token);
              pos[0] += offset2;
              this.onError(pos, "BAD_DIRECTIVE", message, warning);
            });
            this.prelude.push(token.source);
            this.atDirectives = true;
            break;
          case "document": {
            const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
            if (this.atDirectives && !doc.directives.docStart)
              this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
            this.decorate(doc, false);
            if (this.doc)
              yield this.doc;
            this.doc = doc;
            this.atDirectives = false;
            break;
          }
          case "byte-order-mark":
          case "space":
            break;
          case "comment":
          case "newline":
            this.prelude.push(token.source);
            break;
          case "error": {
            const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
            const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
            if (this.atDirectives || !this.doc)
              this.errors.push(error);
            else
              this.doc.errors.push(error);
            break;
          }
          case "doc-end": {
            if (!this.doc) {
              const msg = "Unexpected doc-end without preceding document";
              this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
              break;
            }
            this.doc.directives.docEnd = true;
            const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
            this.decorate(this.doc, true);
            if (end.comment) {
              const dc = this.doc.comment;
              this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
            }
            this.doc.range[2] = end.offset;
            break;
          }
          default:
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
        }
      }
      /**
       * Call at end of input to yield any remaining document.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
          this.decorate(this.doc, true);
          yield this.doc;
          this.doc = null;
        } else if (forceDoc) {
          const opts = Object.assign({ _directives: this.directives }, this.options);
          const doc = new Document.Document(void 0, opts);
          if (this.atDirectives)
            this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
          doc.range = [0, endOffset, endOffset];
          this.decorate(doc, false);
          yield doc;
        }
      }
    };
    exports.Composer = Composer;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst-scalar.js"(exports) {
    "use strict";
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    var errors = require_errors();
    var stringifyString = require_stringifyString();
    function resolveAsScalar(token, strict = true, onError) {
      if (token) {
        const _onError = (pos, code, message) => {
          const offset2 = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
          if (onError)
            onError(offset2, code, message);
          else
            throw new errors.YAMLParseError([offset2, offset2 + 1], code, message);
        };
        switch (token.type) {
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
          case "block-scalar":
            return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
        }
      }
      return null;
    }
    function createScalarToken(value, context) {
      const { implicitKey = false, indent, inFlow = false, offset: offset2 = -1, type = "PLAIN" } = context;
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey,
        indent: indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      const end = context.end ?? [
        { type: "newline", offset: -1, indent, source: "\n" }
      ];
      switch (source[0]) {
        case "|":
        case ">": {
          const he = source.indexOf("\n");
          const head = source.substring(0, he);
          const body = source.substring(he + 1) + "\n";
          const props = [
            { type: "block-scalar-header", offset: offset2, indent, source: head }
          ];
          if (!addEndtoBlockProps(props, end))
            props.push({ type: "newline", offset: -1, indent, source: "\n" });
          return { type: "block-scalar", offset: offset2, indent, props, source: body };
        }
        case '"':
          return { type: "double-quoted-scalar", offset: offset2, indent, source, end };
        case "'":
          return { type: "single-quoted-scalar", offset: offset2, indent, source, end };
        default:
          return { type: "scalar", offset: offset2, indent, source, end };
      }
    }
    function setScalarValue(token, value, context = {}) {
      let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
      let indent = "indent" in token ? token.indent : null;
      if (afterKey && typeof indent === "number")
        indent += 2;
      if (!type)
        switch (token.type) {
          case "single-quoted-scalar":
            type = "QUOTE_SINGLE";
            break;
          case "double-quoted-scalar":
            type = "QUOTE_DOUBLE";
            break;
          case "block-scalar": {
            const header = token.props[0];
            if (header.type !== "block-scalar-header")
              throw new Error("Invalid block scalar header");
            type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
            break;
          }
          default:
            type = "PLAIN";
        }
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      switch (source[0]) {
        case "|":
        case ">":
          setBlockScalarValue(token, source);
          break;
        case '"':
          setFlowScalarValue(token, source, "double-quoted-scalar");
          break;
        case "'":
          setFlowScalarValue(token, source, "single-quoted-scalar");
          break;
        default:
          setFlowScalarValue(token, source, "scalar");
      }
    }
    function setBlockScalarValue(token, source) {
      const he = source.indexOf("\n");
      const head = source.substring(0, he);
      const body = source.substring(he + 1) + "\n";
      if (token.type === "block-scalar") {
        const header = token.props[0];
        if (header.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        header.source = head;
        token.source = body;
      } else {
        const { offset: offset2 } = token;
        const indent = "indent" in token ? token.indent : -1;
        const props = [
          { type: "block-scalar-header", offset: offset2, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
          props.push({ type: "newline", offset: -1, indent, source: "\n" });
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type: "block-scalar", indent, props, source: body });
      }
    }
    function addEndtoBlockProps(props, end) {
      if (end)
        for (const st of end)
          switch (st.type) {
            case "space":
            case "comment":
              props.push(st);
              break;
            case "newline":
              props.push(st);
              return true;
          }
      return false;
    }
    function setFlowScalarValue(token, source, type) {
      switch (token.type) {
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          token.type = type;
          token.source = source;
          break;
        case "block-scalar": {
          const end = token.props.slice(1);
          let oa = source.length;
          if (token.props[0].type === "block-scalar-header")
            oa -= token.props[0].source.length;
          for (const tok of end)
            tok.offset += oa;
          delete token.props;
          Object.assign(token, { type, source, end });
          break;
        }
        case "block-map":
        case "block-seq": {
          const offset2 = token.offset + source.length;
          const nl = { type: "newline", offset: offset2, indent: token.indent, source: "\n" };
          delete token.items;
          Object.assign(token, { type, source, end: [nl] });
          break;
        }
        default: {
          const indent = "indent" in token ? token.indent : -1;
          const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
          for (const key of Object.keys(token))
            if (key !== "type" && key !== "offset")
              delete token[key];
          Object.assign(token, { type, indent, source, end });
        }
      }
    }
    exports.createScalarToken = createScalarToken;
    exports.resolveAsScalar = resolveAsScalar;
    exports.setScalarValue = setScalarValue;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst-stringify.js"(exports) {
    "use strict";
    var stringify = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
    function stringifyToken(token) {
      switch (token.type) {
        case "block-scalar": {
          let res = "";
          for (const tok of token.props)
            res += stringifyToken(tok);
          return res + token.source;
        }
        case "block-map":
        case "block-seq": {
          let res = "";
          for (const item of token.items)
            res += stringifyItem(item);
          return res;
        }
        case "flow-collection": {
          let res = token.start.source;
          for (const item of token.items)
            res += stringifyItem(item);
          for (const st of token.end)
            res += st.source;
          return res;
        }
        case "document": {
          let res = stringifyItem(token);
          if (token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
        default: {
          let res = token.source;
          if ("end" in token && token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
      }
    }
    function stringifyItem({ start, key, sep, value }) {
      let res = "";
      for (const st of start)
        res += st.source;
      if (key)
        res += stringifyToken(key);
      if (sep)
        for (const st of sep)
          res += st.source;
      if (value)
        res += stringifyToken(value);
      return res;
    }
    exports.stringify = stringify;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst-visit.js"(exports) {
    "use strict";
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove item");
    function visit(cst, visitor) {
      if ("type" in cst && cst.type === "document")
        cst = { start: cst.start, value: cst.value };
      _visit(Object.freeze([]), cst, visitor);
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    visit.itemAtPath = (cst, path14) => {
      let item = cst;
      for (const [field, index] of path14) {
        const tok = item?.[field];
        if (tok && "items" in tok) {
          item = tok.items[index];
        } else
          return void 0;
      }
      return item;
    };
    visit.parentCollection = (cst, path14) => {
      const parent = visit.itemAtPath(cst, path14.slice(0, -1));
      const field = path14[path14.length - 1][0];
      const coll = parent?.[field];
      if (coll && "items" in coll)
        return coll;
      throw new Error("Parent collection not found");
    };
    function _visit(path14, item, visitor) {
      let ctrl = visitor(item, path14);
      if (typeof ctrl === "symbol")
        return ctrl;
      for (const field of ["key", "value"]) {
        const token = item[field];
        if (token && "items" in token) {
          for (let i = 0; i < token.items.length; ++i) {
            const ci = _visit(Object.freeze(path14.concat([[field, i]])), token.items[i], visitor);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              token.items.splice(i, 1);
              i -= 1;
            }
          }
          if (typeof ctrl === "function" && field === "key")
            ctrl = ctrl(item, path14);
        }
      }
      return typeof ctrl === "function" ? ctrl(item, path14) : ctrl;
    }
    exports.visit = visit;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/cst.js"(exports) {
    "use strict";
    var cstScalar = require_cst_scalar();
    var cstStringify = require_cst_stringify();
    var cstVisit = require_cst_visit();
    var BOM = "\uFEFF";
    var DOCUMENT = "";
    var FLOW_END = "";
    var SCALAR = "";
    var isCollection = (token) => !!token && "items" in token;
    var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
    function prettyToken(token) {
      switch (token) {
        case BOM:
          return "<BOM>";
        case DOCUMENT:
          return "<DOC>";
        case FLOW_END:
          return "<FLOW_END>";
        case SCALAR:
          return "<SCALAR>";
        default:
          return JSON.stringify(token);
      }
    }
    function tokenType(source) {
      switch (source) {
        case BOM:
          return "byte-order-mark";
        case DOCUMENT:
          return "doc-mode";
        case FLOW_END:
          return "flow-error-end";
        case SCALAR:
          return "scalar";
        case "---":
          return "doc-start";
        case "...":
          return "doc-end";
        case "":
        case "\n":
        case "\r\n":
          return "newline";
        case "-":
          return "seq-item-ind";
        case "?":
          return "explicit-key-ind";
        case ":":
          return "map-value-ind";
        case "{":
          return "flow-map-start";
        case "}":
          return "flow-map-end";
        case "[":
          return "flow-seq-start";
        case "]":
          return "flow-seq-end";
        case ",":
          return "comma";
      }
      switch (source[0]) {
        case " ":
        case "	":
          return "space";
        case "#":
          return "comment";
        case "%":
          return "directive-line";
        case "*":
          return "alias";
        case "&":
          return "anchor";
        case "!":
          return "tag";
        case "'":
          return "single-quoted-scalar";
        case '"':
          return "double-quoted-scalar";
        case "|":
        case ">":
          return "block-scalar-header";
      }
      return null;
    }
    exports.createScalarToken = cstScalar.createScalarToken;
    exports.resolveAsScalar = cstScalar.resolveAsScalar;
    exports.setScalarValue = cstScalar.setScalarValue;
    exports.stringify = cstStringify.stringify;
    exports.visit = cstVisit.visit;
    exports.BOM = BOM;
    exports.DOCUMENT = DOCUMENT;
    exports.FLOW_END = FLOW_END;
    exports.SCALAR = SCALAR;
    exports.isCollection = isCollection;
    exports.isScalar = isScalar;
    exports.prettyToken = prettyToken;
    exports.tokenType = tokenType;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/lexer.js"(exports) {
    "use strict";
    var cst = require_cst();
    function isEmpty(ch) {
      switch (ch) {
        case void 0:
        case " ":
        case "\n":
        case "\r":
        case "	":
          return true;
        default:
          return false;
      }
    }
    var hexDigits = new Set("0123456789ABCDEFabcdef");
    var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
    var flowIndicatorChars = new Set(",[]{}");
    var invalidAnchorChars = new Set(" ,[]{}\n\r	");
    var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
    var Lexer = class {
      constructor() {
        this.atEnd = false;
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        this.buffer = "";
        this.flowKey = false;
        this.flowLevel = 0;
        this.indentNext = 0;
        this.indentValue = 0;
        this.lineEndPos = null;
        this.next = null;
        this.pos = 0;
      }
      /**
       * Generate YAML tokens from the `source` string. If `incomplete`,
       * a part of the last line may be left as a buffer for the next call.
       *
       * @returns A generator of lexical tokens
       */
      *lex(source, incomplete = false) {
        if (source) {
          if (typeof source !== "string")
            throw TypeError("source is not a string");
          this.buffer = this.buffer ? this.buffer + source : source;
          this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? "stream";
        while (next && (incomplete || this.hasChars(1)))
          next = yield* this.parseNext(next);
      }
      atLineEnd() {
        let i = this.pos;
        let ch = this.buffer[i];
        while (ch === " " || ch === "	")
          ch = this.buffer[++i];
        if (!ch || ch === "#" || ch === "\n")
          return true;
        if (ch === "\r")
          return this.buffer[i + 1] === "\n";
        return false;
      }
      charAt(n) {
        return this.buffer[this.pos + n];
      }
      continueScalar(offset2) {
        let ch = this.buffer[offset2];
        if (this.indentNext > 0) {
          let indent = 0;
          while (ch === " ")
            ch = this.buffer[++indent + offset2];
          if (ch === "\r") {
            const next = this.buffer[indent + offset2 + 1];
            if (next === "\n" || !next && !this.atEnd)
              return offset2 + indent + 1;
          }
          return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset2 + indent : -1;
        }
        if (ch === "-" || ch === ".") {
          const dt = this.buffer.substr(offset2, 3);
          if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset2 + 3]))
            return -1;
        }
        return offset2;
      }
      getLine() {
        let end = this.lineEndPos;
        if (typeof end !== "number" || end !== -1 && end < this.pos) {
          end = this.buffer.indexOf("\n", this.pos);
          this.lineEndPos = end;
        }
        if (end === -1)
          return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end - 1] === "\r")
          end -= 1;
        return this.buffer.substring(this.pos, end);
      }
      hasChars(n) {
        return this.pos + n <= this.buffer.length;
      }
      setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
      }
      peek(n) {
        return this.buffer.substr(this.pos, n);
      }
      *parseNext(next) {
        switch (next) {
          case "stream":
            return yield* this.parseStream();
          case "line-start":
            return yield* this.parseLineStart();
          case "block-start":
            return yield* this.parseBlockStart();
          case "doc":
            return yield* this.parseDocument();
          case "flow":
            return yield* this.parseFlowCollection();
          case "quoted-scalar":
            return yield* this.parseQuotedScalar();
          case "block-scalar":
            return yield* this.parseBlockScalar();
          case "plain-scalar":
            return yield* this.parsePlainScalar();
        }
      }
      *parseStream() {
        let line = this.getLine();
        if (line === null)
          return this.setNext("stream");
        if (line[0] === cst.BOM) {
          yield* this.pushCount(1);
          line = line.substring(1);
        }
        if (line[0] === "%") {
          let dirEnd = line.length;
          let cs = line.indexOf("#");
          while (cs !== -1) {
            const ch = line[cs - 1];
            if (ch === " " || ch === "	") {
              dirEnd = cs - 1;
              break;
            } else {
              cs = line.indexOf("#", cs + 1);
            }
          }
          while (true) {
            const ch = line[dirEnd - 1];
            if (ch === " " || ch === "	")
              dirEnd -= 1;
            else
              break;
          }
          const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
          yield* this.pushCount(line.length - n);
          this.pushNewline();
          return "stream";
        }
        if (this.atLineEnd()) {
          const sp = yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - sp);
          yield* this.pushNewline();
          return "stream";
        }
        yield cst.DOCUMENT;
        return yield* this.parseLineStart();
      }
      *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
          return this.setNext("line-start");
        if (ch === "-" || ch === ".") {
          if (!this.atEnd && !this.hasChars(4))
            return this.setNext("line-start");
          const s = this.peek(3);
          if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
            yield* this.pushCount(3);
            this.indentValue = 0;
            this.indentNext = 0;
            return s === "---" ? "doc" : "stream";
          }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
          this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
      }
      *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
          return this.setNext("block-start");
        if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
          const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
          this.indentNext = this.indentValue + 1;
          this.indentValue += n;
          return "block-start";
        }
        return "doc";
      }
      *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
          return this.setNext("doc");
        let n = yield* this.pushIndicators();
        switch (line[n]) {
          case "#":
            yield* this.pushCount(line.length - n);
          // fallthrough
          case void 0:
            yield* this.pushNewline();
            return yield* this.parseLineStart();
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel = 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            return "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "doc";
          case '"':
          case "'":
            return yield* this.parseQuotedScalar();
          case "|":
          case ">":
            n += yield* this.parseBlockScalarHeader();
            n += yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - n);
            yield* this.pushNewline();
            return yield* this.parseBlockScalar();
          default:
            return yield* this.parsePlainScalar();
        }
      }
      *parseFlowCollection() {
        let nl, sp;
        let indent = -1;
        do {
          nl = yield* this.pushNewline();
          if (nl > 0) {
            sp = yield* this.pushSpaces(false);
            this.indentValue = indent = sp;
          } else {
            sp = 0;
          }
          sp += yield* this.pushSpaces(true);
        } while (nl + sp > 0);
        const line = this.getLine();
        if (line === null)
          return this.setNext("flow");
        if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
          const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
          if (!atFlowEndMarker) {
            this.flowLevel = 0;
            yield cst.FLOW_END;
            return yield* this.parseLineStart();
          }
        }
        let n = 0;
        while (line[n] === ",") {
          n += yield* this.pushCount(1);
          n += yield* this.pushSpaces(true);
          this.flowKey = false;
        }
        n += yield* this.pushIndicators();
        switch (line[n]) {
          case void 0:
            return "flow";
          case "#":
            yield* this.pushCount(line.length - n);
            return "flow";
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel += 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            this.flowKey = true;
            this.flowLevel -= 1;
            return this.flowLevel ? "flow" : "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "flow";
          case '"':
          case "'":
            this.flowKey = true;
            return yield* this.parseQuotedScalar();
          case ":": {
            const next = this.charAt(1);
            if (this.flowKey || isEmpty(next) || next === ",") {
              this.flowKey = false;
              yield* this.pushCount(1);
              yield* this.pushSpaces(true);
              return "flow";
            }
          }
          // fallthrough
          default:
            this.flowKey = false;
            return yield* this.parsePlainScalar();
        }
      }
      *parseQuotedScalar() {
        const quote = this.charAt(0);
        let end = this.buffer.indexOf(quote, this.pos + 1);
        if (quote === "'") {
          while (end !== -1 && this.buffer[end + 1] === "'")
            end = this.buffer.indexOf("'", end + 2);
        } else {
          while (end !== -1) {
            let n = 0;
            while (this.buffer[end - 1 - n] === "\\")
              n += 1;
            if (n % 2 === 0)
              break;
            end = this.buffer.indexOf('"', end + 1);
          }
        }
        const qb = this.buffer.substring(0, end);
        let nl = qb.indexOf("\n", this.pos);
        if (nl !== -1) {
          while (nl !== -1) {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = qb.indexOf("\n", cs);
          }
          if (nl !== -1) {
            end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
          }
        }
        if (end === -1) {
          if (!this.atEnd)
            return this.setNext("quoted-scalar");
          end = this.buffer.length;
        }
        yield* this.pushToIndex(end + 1, false);
        return this.flowLevel ? "flow" : "doc";
      }
      *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i = this.pos;
        while (true) {
          const ch = this.buffer[++i];
          if (ch === "+")
            this.blockScalarKeep = true;
          else if (ch > "0" && ch <= "9")
            this.blockScalarIndent = Number(ch) - 1;
          else if (ch !== "-")
            break;
        }
        return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
      }
      *parseBlockScalar() {
        let nl = this.pos - 1;
        let indent = 0;
        let ch;
        loop: for (let i2 = this.pos; ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case "\n":
              nl = i2;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === "\n")
                break;
            }
            // fallthrough
            default:
              break loop;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("block-scalar");
        if (indent >= this.indentNext) {
          if (this.blockScalarIndent === -1)
            this.indentNext = indent;
          else {
            this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
          }
          do {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = this.buffer.indexOf("\n", cs);
          } while (nl !== -1);
          if (nl === -1) {
            if (!this.atEnd)
              return this.setNext("block-scalar");
            nl = this.buffer.length;
          }
        }
        let i = nl + 1;
        ch = this.buffer[i];
        while (ch === " ")
          ch = this.buffer[++i];
        if (ch === "	") {
          while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
            ch = this.buffer[++i];
          nl = i - 1;
        } else if (!this.blockScalarKeep) {
          do {
            let i2 = nl - 1;
            let ch2 = this.buffer[i2];
            if (ch2 === "\r")
              ch2 = this.buffer[--i2];
            const lastChar = i2;
            while (ch2 === " ")
              ch2 = this.buffer[--i2];
            if (ch2 === "\n" && i2 >= this.pos && i2 + 1 + indent > lastChar)
              nl = i2;
            else
              break;
          } while (true);
        }
        yield cst.SCALAR;
        yield* this.pushToIndex(nl + 1, true);
        return yield* this.parseLineStart();
      }
      *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end = this.pos - 1;
        let i = this.pos - 1;
        let ch;
        while (ch = this.buffer[++i]) {
          if (ch === ":") {
            const next = this.buffer[i + 1];
            if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
              break;
            end = i;
          } else if (isEmpty(ch)) {
            let next = this.buffer[i + 1];
            if (ch === "\r") {
              if (next === "\n") {
                i += 1;
                ch = "\n";
                next = this.buffer[i + 1];
              } else
                end = i;
            }
            if (next === "#" || inFlow && flowIndicatorChars.has(next))
              break;
            if (ch === "\n") {
              const cs = this.continueScalar(i + 1);
              if (cs === -1)
                break;
              i = Math.max(i, cs - 2);
            }
          } else {
            if (inFlow && flowIndicatorChars.has(ch))
              break;
            end = i;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("plain-scalar");
        yield cst.SCALAR;
        yield* this.pushToIndex(end + 1, true);
        return inFlow ? "flow" : "doc";
      }
      *pushCount(n) {
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos += n;
          return n;
        }
        return 0;
      }
      *pushToIndex(i, allowEmpty) {
        const s = this.buffer.slice(this.pos, i);
        if (s) {
          yield s;
          this.pos += s.length;
          return s.length;
        } else if (allowEmpty)
          yield "";
        return 0;
      }
      *pushIndicators() {
        let n = 0;
        loop: while (true) {
          switch (this.charAt(0)) {
            case "!":
              n += yield* this.pushTag();
              n += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n += yield* this.pushUntil(isNotAnchorChar);
              n += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            // this is an error
            case "?":
            // this is an error outside flow collections
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n += yield* this.pushCount(1);
                n += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
        return n;
      }
      *pushTag() {
        if (this.charAt(1) === "<") {
          let i = this.pos + 2;
          let ch = this.buffer[i];
          while (!isEmpty(ch) && ch !== ">")
            ch = this.buffer[++i];
          return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
        } else {
          let i = this.pos + 1;
          let ch = this.buffer[i];
          while (ch) {
            if (tagChars.has(ch))
              ch = this.buffer[++i];
            else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
              ch = this.buffer[i += 3];
            } else
              break;
          }
          return yield* this.pushToIndex(i, false);
        }
      }
      *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === "\n")
          return yield* this.pushCount(1);
        else if (ch === "\r" && this.charAt(1) === "\n")
          return yield* this.pushCount(2);
        else
          return 0;
      }
      *pushSpaces(allowTabs) {
        let i = this.pos - 1;
        let ch;
        do {
          ch = this.buffer[++i];
        } while (ch === " " || allowTabs && ch === "	");
        const n = i - this.pos;
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos = i;
        }
        return n;
      }
      *pushUntil(test) {
        let i = this.pos;
        let ch = this.buffer[i];
        while (!test(ch))
          ch = this.buffer[++i];
        return yield* this.pushToIndex(i, false);
      }
    };
    exports.Lexer = Lexer;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/line-counter.js"(exports) {
    "use strict";
    var LineCounter = class {
      constructor() {
        this.lineStarts = [];
        this.addNewLine = (offset2) => this.lineStarts.push(offset2);
        this.linePos = (offset2) => {
          let low = 0;
          let high = this.lineStarts.length;
          while (low < high) {
            const mid = low + high >> 1;
            if (this.lineStarts[mid] < offset2)
              low = mid + 1;
            else
              high = mid;
          }
          if (this.lineStarts[low] === offset2)
            return { line: low + 1, col: 1 };
          if (low === 0)
            return { line: 0, col: offset2 };
          const start = this.lineStarts[low - 1];
          return { line: low, col: offset2 - start + 1 };
        };
      }
    };
    exports.LineCounter = LineCounter;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/parse/parser.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var cst = require_cst();
    var lexer = require_lexer();
    function includesToken(list2, type) {
      for (let i = 0; i < list2.length; ++i)
        if (list2[i].type === type)
          return true;
      return false;
    }
    function findNonEmptyIndex(list2) {
      for (let i = 0; i < list2.length; ++i) {
        switch (list2[i].type) {
          case "space":
          case "comment":
          case "newline":
            break;
          default:
            return i;
        }
      }
      return -1;
    }
    function isFlowToken(token) {
      switch (token?.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "flow-collection":
          return true;
        default:
          return false;
      }
    }
    function getPrevProps(parent) {
      switch (parent.type) {
        case "document":
          return parent.start;
        case "block-map": {
          const it = parent.items[parent.items.length - 1];
          return it.sep ?? it.start;
        }
        case "block-seq":
          return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
          return [];
      }
    }
    function getFirstKeyStartProps(prev) {
      if (prev.length === 0)
        return [];
      let i = prev.length;
      loop: while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
      while (prev[++i]?.type === "space") {
      }
      return prev.splice(i, prev.length);
    }
    function arrayPushArray(target, source) {
      if (source.length < 1e5)
        Array.prototype.push.apply(target, source);
      else
        for (let i = 0; i < source.length; ++i)
          target.push(source[i]);
    }
    function fixFlowSeqItems(fc) {
      if (fc.start.type === "flow-seq-start") {
        for (const it of fc.items) {
          if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
            if (it.key)
              it.value = it.key;
            delete it.key;
            if (isFlowToken(it.value)) {
              if (it.value.end)
                arrayPushArray(it.value.end, it.sep);
              else
                it.value.end = it.sep;
            } else
              arrayPushArray(it.start, it.sep);
            delete it.sep;
          }
        }
      }
    }
    var Parser = class {
      /**
       * @param onNewLine - If defined, called separately with the start position of
       *   each new line (in `parse()`, including the start of input).
       */
      constructor(onNewLine) {
        this.atNewLine = true;
        this.atScalar = false;
        this.indent = 0;
        this.offset = 0;
        this.onKeyLine = false;
        this.stack = [];
        this.source = "";
        this.type = "";
        this.lexer = new lexer.Lexer();
        this.onNewLine = onNewLine;
      }
      /**
       * Parse `source` as a YAML stream.
       * If `incomplete`, a part of the last line may be left as a buffer for the next call.
       *
       * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
       *
       * @returns A generator of tokens representing each directive, document, and other structure.
       */
      *parse(source, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
          this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source, incomplete))
          yield* this.next(lexeme);
        if (!incomplete)
          yield* this.end();
      }
      /**
       * Advance the parser by the `source` of one lexical token.
       */
      *next(source) {
        this.source = source;
        if (node_process.env.LOG_TOKENS)
          console.log("|", cst.prettyToken(source));
        if (this.atScalar) {
          this.atScalar = false;
          yield* this.step();
          this.offset += source.length;
          return;
        }
        const type = cst.tokenType(source);
        if (!type) {
          const message = `Not a YAML token: ${source}`;
          yield* this.pop({ type: "error", offset: this.offset, message, source });
          this.offset += source.length;
        } else if (type === "scalar") {
          this.atNewLine = false;
          this.atScalar = true;
          this.type = "scalar";
        } else {
          this.type = type;
          yield* this.step();
          switch (type) {
            case "newline":
              this.atNewLine = true;
              this.indent = 0;
              if (this.onNewLine)
                this.onNewLine(this.offset + source.length);
              break;
            case "space":
              if (this.atNewLine && source[0] === " ")
                this.indent += source.length;
              break;
            case "explicit-key-ind":
            case "map-value-ind":
            case "seq-item-ind":
              if (this.atNewLine)
                this.indent += source.length;
              break;
            case "doc-mode":
            case "flow-error-end":
              return;
            default:
              this.atNewLine = false;
          }
          this.offset += source.length;
        }
      }
      /** Call at end of input to push out any remaining constructions */
      *end() {
        while (this.stack.length > 0)
          yield* this.pop();
      }
      get sourceToken() {
        const st = {
          type: this.type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
        return st;
      }
      *step() {
        const top = this.peek(1);
        if (this.type === "doc-end" && top?.type !== "doc-end") {
          while (this.stack.length > 0)
            yield* this.pop();
          this.stack.push({
            type: "doc-end",
            offset: this.offset,
            source: this.source
          });
          return;
        }
        if (!top)
          return yield* this.stream();
        switch (top.type) {
          case "document":
            return yield* this.document(top);
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return yield* this.scalar(top);
          case "block-scalar":
            return yield* this.blockScalar(top);
          case "block-map":
            return yield* this.blockMap(top);
          case "block-seq":
            return yield* this.blockSequence(top);
          case "flow-collection":
            return yield* this.flowCollection(top);
          case "doc-end":
            return yield* this.documentEnd(top);
        }
        yield* this.pop();
      }
      peek(n) {
        return this.stack[this.stack.length - n];
      }
      *pop(error) {
        const token = error ?? this.stack.pop();
        if (!token) {
          const message = "Tried to pop an empty stack";
          yield { type: "error", offset: this.offset, source: "", message };
        } else if (this.stack.length === 0) {
          yield token;
        } else {
          const top = this.peek(1);
          if (token.type === "block-scalar") {
            token.indent = "indent" in top ? top.indent : 0;
          } else if (token.type === "flow-collection" && top.type === "document") {
            token.indent = 0;
          }
          if (token.type === "flow-collection")
            fixFlowSeqItems(token);
          switch (top.type) {
            case "document":
              top.value = token;
              break;
            case "block-scalar":
              top.props.push(token);
              break;
            case "block-map": {
              const it = top.items[top.items.length - 1];
              if (it.value) {
                top.items.push({ start: [], key: token, sep: [] });
                this.onKeyLine = true;
                return;
              } else if (it.sep) {
                it.value = token;
              } else {
                Object.assign(it, { key: token, sep: [] });
                this.onKeyLine = !it.explicitKey;
                return;
              }
              break;
            }
            case "block-seq": {
              const it = top.items[top.items.length - 1];
              if (it.value)
                top.items.push({ start: [], value: token });
              else
                it.value = token;
              break;
            }
            case "flow-collection": {
              const it = top.items[top.items.length - 1];
              if (!it || it.value)
                top.items.push({ start: [], key: token, sep: [] });
              else if (it.sep)
                it.value = token;
              else
                Object.assign(it, { key: token, sep: [] });
              return;
            }
            /* istanbul ignore next should not happen */
            default:
              yield* this.pop();
              yield* this.pop(token);
          }
          if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
            const last = token.items[token.items.length - 1];
            if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
              if (top.type === "document")
                top.end = last.start;
              else
                top.items.push({ start: last.start });
              token.items.splice(-1, 1);
            }
          }
        }
      }
      *stream() {
        switch (this.type) {
          case "directive-line":
            yield { type: "directive", offset: this.offset, source: this.source };
            return;
          case "byte-order-mark":
          case "space":
          case "comment":
          case "newline":
            yield this.sourceToken;
            return;
          case "doc-mode":
          case "doc-start": {
            const doc = {
              type: "document",
              offset: this.offset,
              start: []
            };
            if (this.type === "doc-start")
              doc.start.push(this.sourceToken);
            this.stack.push(doc);
            return;
          }
        }
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML stream`,
          source: this.source
        };
      }
      *document(doc) {
        if (doc.value)
          return yield* this.lineEnd(doc);
        switch (this.type) {
          case "doc-start": {
            if (findNonEmptyIndex(doc.start) !== -1) {
              yield* this.pop();
              yield* this.step();
            } else
              doc.start.push(this.sourceToken);
            return;
          }
          case "anchor":
          case "tag":
          case "space":
          case "comment":
          case "newline":
            doc.start.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
          this.stack.push(bv);
        else {
          yield {
            type: "error",
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML document`,
            source: this.source
          };
        }
      }
      *scalar(scalar) {
        if (this.type === "map-value-ind") {
          const prev = getPrevProps(this.peek(2));
          const start = getFirstKeyStartProps(prev);
          let sep;
          if (scalar.end) {
            sep = scalar.end;
            sep.push(this.sourceToken);
            delete scalar.end;
          } else
            sep = [this.sourceToken];
          const map = {
            type: "block-map",
            offset: scalar.offset,
            indent: scalar.indent,
            items: [{ start, key: scalar, sep }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else
          yield* this.lineEnd(scalar);
      }
      *blockScalar(scalar) {
        switch (this.type) {
          case "space":
          case "comment":
          case "newline":
            scalar.props.push(this.sourceToken);
            return;
          case "scalar":
            scalar.source = this.source;
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine) {
              let nl = this.source.indexOf("\n") + 1;
              while (nl !== 0) {
                this.onNewLine(this.offset + nl);
                nl = this.source.indexOf("\n", nl) + 1;
              }
            }
            yield* this.pop();
            break;
          /* istanbul ignore next should not happen */
          default:
            yield* this.pop();
            yield* this.step();
        }
      }
      *blockMap(map) {
        const it = map.items[map.items.length - 1];
        switch (this.type) {
          case "newline":
            this.onKeyLine = false;
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "space":
          case "comment":
            if (it.value) {
              map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              if (this.atIndentedComment(it.start, map.indent)) {
                const prev = map.items[map.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  map.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
        }
        if (this.indent >= map.indent) {
          const atMapIndent = !this.onKeyLine && this.indent === map.indent;
          const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
          let start = [];
          if (atNextItem && it.sep && !it.value) {
            const nl = [];
            for (let i = 0; i < it.sep.length; ++i) {
              const st = it.sep[i];
              switch (st.type) {
                case "newline":
                  nl.push(i);
                  break;
                case "space":
                  break;
                case "comment":
                  if (st.indent > map.indent)
                    nl.length = 0;
                  break;
                default:
                  nl.length = 0;
              }
            }
            if (nl.length >= 2)
              start = it.sep.splice(nl[1]);
          }
          switch (this.type) {
            case "anchor":
            case "tag":
              if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start });
                this.onKeyLine = true;
              } else if (it.sep) {
                it.sep.push(this.sourceToken);
              } else {
                it.start.push(this.sourceToken);
              }
              return;
            case "explicit-key-ind":
              if (!it.sep && !it.explicitKey) {
                it.start.push(this.sourceToken);
                it.explicitKey = true;
              } else if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start, explicitKey: true });
              } else {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [this.sourceToken], explicitKey: true }]
                });
              }
              this.onKeyLine = true;
              return;
            case "map-value-ind":
              if (it.explicitKey) {
                if (!it.sep) {
                  if (includesToken(it.start, "newline")) {
                    Object.assign(it, { key: null, sep: [this.sourceToken] });
                  } else {
                    const start2 = getFirstKeyStartProps(it.start);
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                    });
                  }
                } else if (it.value) {
                  map.items.push({ start: [], key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                  });
                } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                  const start2 = getFirstKeyStartProps(it.start);
                  const key = it.key;
                  const sep = it.sep;
                  sep.push(this.sourceToken);
                  delete it.key;
                  delete it.sep;
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key, sep }]
                  });
                } else if (start.length > 0) {
                  it.sep = it.sep.concat(start, this.sourceToken);
                } else {
                  it.sep.push(this.sourceToken);
                }
              } else {
                if (!it.sep) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else if (it.value || atNextItem) {
                  map.items.push({ start, key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [], key: null, sep: [this.sourceToken] }]
                  });
                } else {
                  it.sep.push(this.sourceToken);
                }
              }
              this.onKeyLine = true;
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (atNextItem || it.value) {
                map.items.push({ start, key: fs, sep: [] });
                this.onKeyLine = true;
              } else if (it.sep) {
                this.stack.push(fs);
              } else {
                Object.assign(it, { key: fs, sep: [] });
                this.onKeyLine = true;
              }
              return;
            }
            default: {
              const bv = this.startBlockValue(map);
              if (bv) {
                if (bv.type === "block-seq") {
                  if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                    yield* this.pop({
                      type: "error",
                      offset: this.offset,
                      message: "Unexpected block-seq-ind on same line with key",
                      source: this.source
                    });
                    return;
                  }
                } else if (atMapIndent) {
                  map.items.push({ start });
                }
                this.stack.push(bv);
                return;
              }
            }
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *blockSequence(seq) {
        const it = seq.items[seq.items.length - 1];
        switch (this.type) {
          case "newline":
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                seq.items.push({ start: [this.sourceToken] });
            } else
              it.start.push(this.sourceToken);
            return;
          case "space":
          case "comment":
            if (it.value)
              seq.items.push({ start: [this.sourceToken] });
            else {
              if (this.atIndentedComment(it.start, seq.indent)) {
                const prev = seq.items[seq.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  seq.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
          case "anchor":
          case "tag":
            if (it.value || this.indent <= seq.indent)
              break;
            it.start.push(this.sourceToken);
            return;
          case "seq-item-ind":
            if (this.indent !== seq.indent)
              break;
            if (it.value || includesToken(it.start, "seq-item-ind"))
              seq.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
        }
        if (this.indent > seq.indent) {
          const bv = this.startBlockValue(seq);
          if (bv) {
            this.stack.push(bv);
            return;
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *flowCollection(fc) {
        const it = fc.items[fc.items.length - 1];
        if (this.type === "flow-error-end") {
          let top;
          do {
            yield* this.pop();
            top = this.peek(1);
          } while (top?.type === "flow-collection");
        } else if (fc.end.length === 0) {
          switch (this.type) {
            case "comma":
            case "explicit-key-ind":
              if (!it || it.sep)
                fc.items.push({ start: [this.sourceToken] });
              else
                it.start.push(this.sourceToken);
              return;
            case "map-value-ind":
              if (!it || it.value)
                fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              return;
            case "space":
            case "comment":
            case "newline":
            case "anchor":
            case "tag":
              if (!it || it.value)
                fc.items.push({ start: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                it.start.push(this.sourceToken);
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (!it || it.value)
                fc.items.push({ start: [], key: fs, sep: [] });
              else if (it.sep)
                this.stack.push(fs);
              else
                Object.assign(it, { key: fs, sep: [] });
              return;
            }
            case "flow-map-end":
            case "flow-seq-end":
              fc.end.push(this.sourceToken);
              return;
          }
          const bv = this.startBlockValue(fc);
          if (bv)
            this.stack.push(bv);
          else {
            yield* this.pop();
            yield* this.step();
          }
        } else {
          const parent = this.peek(2);
          if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
            yield* this.pop();
            yield* this.step();
          } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            fixFlowSeqItems(fc);
            const sep = fc.end.splice(1, fc.end.length);
            sep.push(this.sourceToken);
            const map = {
              type: "block-map",
              offset: fc.offset,
              indent: fc.indent,
              items: [{ start, key: fc, sep }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map;
          } else {
            yield* this.lineEnd(fc);
          }
        }
      }
      flowScalar(type) {
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        return {
          type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
      }
      startBlockValue(parent) {
        switch (this.type) {
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return this.flowScalar(this.type);
          case "block-scalar-header":
            return {
              type: "block-scalar",
              offset: this.offset,
              indent: this.indent,
              props: [this.sourceToken],
              source: ""
            };
          case "flow-map-start":
          case "flow-seq-start":
            return {
              type: "flow-collection",
              offset: this.offset,
              indent: this.indent,
              start: this.sourceToken,
              items: [],
              end: []
            };
          case "seq-item-ind":
            return {
              type: "block-seq",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken] }]
            };
          case "explicit-key-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            start.push(this.sourceToken);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, explicitKey: true }]
            };
          }
          case "map-value-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, key: null, sep: [this.sourceToken] }]
            };
          }
        }
        return null;
      }
      atIndentedComment(start, indent) {
        if (this.type !== "comment")
          return false;
        if (this.indent <= indent)
          return false;
        return start.every((st) => st.type === "newline" || st.type === "space");
      }
      *documentEnd(docEnd) {
        if (this.type !== "doc-mode") {
          if (docEnd.end)
            docEnd.end.push(this.sourceToken);
          else
            docEnd.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
        }
      }
      *lineEnd(token) {
        switch (this.type) {
          case "comma":
          case "doc-start":
          case "doc-end":
          case "flow-seq-end":
          case "flow-map-end":
          case "map-value-ind":
            yield* this.pop();
            yield* this.step();
            break;
          case "newline":
            this.onKeyLine = false;
          // fallthrough
          case "space":
          case "comment":
          default:
            if (token.end)
              token.end.push(this.sourceToken);
            else
              token.end = [this.sourceToken];
            if (this.type === "newline")
              yield* this.pop();
        }
      }
    };
    exports.Parser = Parser;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/public-api.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var errors = require_errors();
    var log = require_log();
    var identity = require_identity();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    function parseOptions(options) {
      const prettyErrors = options.prettyErrors !== false;
      const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null;
      return { lineCounter: lineCounter$1, prettyErrors };
    }
    function parseAllDocuments(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      const docs = Array.from(composer$1.compose(parser$1.parse(source)));
      if (prettyErrors && lineCounter2)
        for (const doc of docs) {
          doc.errors.forEach(errors.prettifyError(source, lineCounter2));
          doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
        }
      if (docs.length > 0)
        return docs;
      return Object.assign([], { empty: true }, composer$1.streamInfo());
    }
    function parseDocument(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      let doc = null;
      for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
        if (!doc)
          doc = _doc;
        else if (doc.options.logLevel !== "silent") {
          doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
          break;
        }
      }
      if (prettyErrors && lineCounter2) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
      return doc;
    }
    function parse(src, reviver, options) {
      let _reviver = void 0;
      if (typeof reviver === "function") {
        _reviver = reviver;
      } else if (options === void 0 && reviver && typeof reviver === "object") {
        options = reviver;
      }
      const doc = parseDocument(src, options);
      if (!doc)
        return null;
      doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
      if (doc.errors.length > 0) {
        if (doc.options.logLevel !== "silent")
          throw doc.errors[0];
        else
          doc.errors = [];
      }
      return doc.toJS(Object.assign({ reviver: _reviver }, options));
    }
    function stringify(value, replacer, options) {
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === void 0 && replacer) {
        options = replacer;
      }
      if (typeof options === "string")
        options = options.length;
      if (typeof options === "number") {
        const indent = Math.round(options);
        options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
      }
      if (value === void 0) {
        const { keepUndefined } = options ?? replacer ?? {};
        if (!keepUndefined)
          return void 0;
      }
      if (identity.isDocument(value) && !_replacer)
        return value.toString(options);
      return new Document.Document(value, _replacer, options).toString(options);
    }
    exports.parse = parse;
    exports.parseAllDocuments = parseAllDocuments;
    exports.parseDocument = parseDocument;
    exports.stringify = stringify;
  }
});

// node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/index.js
var require_dist = __commonJS({
  "node_modules/.pnpm/yaml@2.9.1/node_modules/yaml/dist/index.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var Schema = require_Schema();
    var errors = require_errors();
    var Alias = require_Alias();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var cst = require_cst();
    var lexer = require_lexer();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    var publicApi = require_public_api();
    var visit = require_visit();
    exports.Composer = composer.Composer;
    exports.Document = Document.Document;
    exports.Schema = Schema.Schema;
    exports.YAMLError = errors.YAMLError;
    exports.YAMLParseError = errors.YAMLParseError;
    exports.YAMLWarning = errors.YAMLWarning;
    exports.Alias = Alias.Alias;
    exports.isAlias = identity.isAlias;
    exports.isCollection = identity.isCollection;
    exports.isDocument = identity.isDocument;
    exports.isMap = identity.isMap;
    exports.isNode = identity.isNode;
    exports.isPair = identity.isPair;
    exports.isScalar = identity.isScalar;
    exports.isSeq = identity.isSeq;
    exports.Pair = Pair.Pair;
    exports.Scalar = Scalar.Scalar;
    exports.YAMLMap = YAMLMap.YAMLMap;
    exports.YAMLSeq = YAMLSeq.YAMLSeq;
    exports.CST = cst;
    exports.Lexer = lexer.Lexer;
    exports.LineCounter = lineCounter.LineCounter;
    exports.Parser = parser.Parser;
    exports.parse = publicApi.parse;
    exports.parseAllDocuments = publicApi.parseAllDocuments;
    exports.parseDocument = publicApi.parseDocument;
    exports.stringify = publicApi.stringify;
    exports.visit = visit.visit;
    exports.visitAsync = visit.visitAsync;
  }
});

// src/cli/main.ts
import { parseArgs } from "node:util";

// src/version.ts
var VERSION = "0.1.0";

// src/cli/commands/classify.ts
import os3 from "node:os";

// src/classify/phases.ts
var PHASES = [
  { id: "writing-code", label: "Writing code" },
  { id: "writing-tests", label: "Writing tests" },
  { id: "lint", label: "Lint and format" },
  { id: "tests", label: "Running tests" },
  { id: "build", label: "Build" },
  { id: "rework", label: "Rework" },
  { id: "exploring", label: "Exploring" },
  { id: "planning", label: "Planning and answering" },
  { id: "waiting", label: "Waiting on you" },
  { id: "unclassified", label: "Unclassified" }
];
var PHASE_LABEL = Object.fromEntries(PHASES.map((p) => [p.id, p.label]));
function isCheckPhase(phase) {
  return phase === "lint" || phase === "tests" || phase === "build";
}
var RANK = {
  build: 10,
  tests: 9,
  lint: 8,
  rework: 7,
  "writing-tests": 6,
  "writing-code": 5,
  exploring: 4,
  planning: 3,
  waiting: 2,
  unclassified: 1
};
function topPhase(phases) {
  let best;
  for (const phase of phases) if (!best || RANK[phase] > RANK[best]) best = phase;
  return best;
}

// src/model/time.ts
function formatDuration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "\u2013";
  if (ms < 1e3) return `${Math.round(ms)} ms`;
  if (ms < 1e4) return `${(ms / 1e3).toFixed(1)}s`;
  const totalSeconds = Math.round(ms / 1e3);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  if (minutes > 0) return `${minutes}m ${pad(seconds)}s`;
  return `${seconds}s`;
}
function pad(n) {
  return String(n).padStart(2, "0");
}
function formatClock(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function parseSince(value) {
  const match = /^(\d+(?:\.\d+)?)\s*(d|h|m|w)$/.exec(value.trim());
  if (!match) throw new Error(`can't read "${value}": use a number and d, h, m or w, like 30d`);
  const n = Number(match[1]);
  const unit = { m: 6e4, h: 36e5, d: 864e5, w: 6048e5 }[match[2]];
  return n * unit;
}

// src/cli/load.ts
import path10 from "node:path";

// src/classify/classify.ts
import path3 from "node:path";

// src/recorder/steps.ts
var AGENT_TOOLS = /* @__PURE__ */ new Set(["Agent", "Task"]);
var BACKGROUND_AGENT_MS = 1e3;
function eventsToSession(sessionId, events) {
  const sorted = events.map((event, index) => ({ event, index })).sort((a, b) => a.event.t - b.event.t || a.index - b.index).map((x) => x.event);
  const builder = new Builder(sessionId);
  for (const event of sorted) builder.handle(event);
  return builder.finish();
}
var Builder = class {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.main = this.newCtx(void 0, null);
    this.ctxs.set("main", this.main);
  }
  sessionId;
  steps = [];
  ctxs = /* @__PURE__ */ new Map();
  main;
  inputHash = /* @__PURE__ */ new Map();
  approvalAt = /* @__PURE__ */ new Map();
  agentCalls = [];
  linkedCalls = /* @__PURE__ */ new Set();
  subagents = /* @__PURE__ */ new Map();
  compactions = [];
  turn = null;
  compaction = null;
  lastTurnEnd = null;
  startMs = Infinity;
  endMs = -Infinity;
  cwd;
  transcriptPath;
  counter = 0;
  handle(e) {
    this.startMs = Math.min(this.startMs, e.t);
    this.endMs = Math.max(this.endMs, e.t);
    if (e.cwd && !this.cwd) this.cwd = e.cwd;
    if (e.tp) this.transcriptPath = e.tp;
    switch (e.e) {
      case "UserPromptSubmit":
        this.startTurn(e);
        break;
      case "PreToolUse":
        this.preTool(e);
        break;
      case "PermissionRequest":
        this.permission(e);
        break;
      case "PermissionDenied":
        this.denied(e);
        break;
      case "PostToolUse":
      case "PostToolUseFailure":
        this.postTool(e);
        break;
      case "PostToolBatch":
        this.batchDone(e);
        break;
      case "SubagentStart":
        this.subagentStart(e);
        break;
      case "SubagentStop":
        this.subagentStop(e);
        break;
      case "Stop":
      case "StopFailure":
        this.stop(e);
        break;
      case "PreCompact":
        this.compactStart(e.t);
        break;
      case "PostCompact":
        this.compactEnd(e.t);
        break;
      case "SessionEnd":
        this.closeAll(e.t);
        break;
    }
  }
  finish() {
    if (!Number.isFinite(this.startMs)) return this.session(0, 0);
    this.closeAll(this.endMs);
    for (const step of this.steps) {
      if (step.endMs < step.startMs) step.endMs = step.startMs;
    }
    for (const sub of this.subagents.values()) {
      const call = this.agentCalls.find((c) => c.id === sub.parentId);
      if (call && call.endMs + BACKGROUND_AGENT_MS < sub.endMs && !sub.flags.includes("background")) {
        sub.flags.push("background");
      }
    }
    if (this.steps.length === 0) return this.session(this.startMs, this.endMs);
    return this.session(
      Math.min(...this.steps.map((s) => s.startMs)),
      Math.max(...this.steps.map((s) => s.endMs))
    );
  }
  session(startMs, endMs) {
    const session = {
      id: this.sessionId,
      agent: "claude-code",
      sources: ["recorder"],
      startMs,
      endMs,
      steps: this.steps
    };
    if (this.cwd) session.cwd = this.cwd;
    if (this.transcriptPath) session.transcriptPath = this.transcriptPath;
    return session;
  }
  newCtx(agentId, parentId) {
    return {
      agentId,
      parentId,
      modelStart: null,
      modelParts: [],
      lastModel: null,
      batchOpen: false,
      open: /* @__PURE__ */ new Map(),
      lastToolEnd: null
    };
  }
  id(prefix) {
    return `${prefix}:${++this.counter}`;
  }
  push(step) {
    this.steps.push(step);
    return step;
  }
  /** The context an event belongs to; a subagent's context is created on first sight. */
  ctxFor(e) {
    if (!e.aid) return this.main;
    const existing2 = this.ctxs.get(e.aid);
    if (existing2) return existing2;
    this.openSubagent(e.aid, e.at, e.t);
    return this.ctxs.get(e.aid);
  }
  openTurn(t, flags = []) {
    if (this.lastTurnEnd !== null && t > this.lastTurnEnd) this.addIdle(this.lastTurnEnd, t);
    this.turn = this.push({
      id: this.id("turn"),
      parentId: null,
      kind: "turn",
      startMs: t,
      endMs: t,
      flags
    });
    this.main.parentId = this.turn.id;
    this.main.modelParts = [];
    this.main.lastModel = null;
    this.main.batchOpen = false;
    this.main.lastToolEnd = null;
  }
  /** Idle time between turns, with compactions carved out of it. */
  addIdle(from, to) {
    let cursor = from;
    const cuts = this.compactions.filter((c) => c.parentId === null && c.endMs > from && c.startMs < to).sort((a, b) => a.startMs - b.startMs);
    for (const cut of cuts) {
      if (cut.startMs > cursor) this.pushIdle(cursor, cut.startMs);
      cursor = Math.max(cursor, cut.endMs);
    }
    if (to > cursor) this.pushIdle(cursor, to);
  }
  pushIdle(from, to) {
    this.push({
      id: this.id("idle"),
      parentId: null,
      kind: "idle",
      startMs: from,
      endMs: to,
      flags: []
    });
  }
  startTurn(e) {
    if (this.turn) {
      this.closeModel(this.main, e.t, ["interrupted"]);
      this.closeOpenTools(this.main, e.t, "interrupted");
      this.closeTurn(e.t);
    }
    this.openTurn(e.t, e.src === "task-notification" ? ["notification"] : []);
    this.main.modelStart = e.t;
  }
  ensureTurn(t) {
    if (!this.turn) this.openTurn(t);
  }
  closeTurn(t) {
    if (!this.turn) return;
    this.turn.endMs = Math.max(this.turn.endMs, t);
    this.lastTurnEnd = this.turn.endMs;
    this.turn = null;
  }
  /** Ends the current stretch of model time. Returns its steps (more than one if a compaction cut it). */
  closeModel(ctx, t, flags) {
    const segments = ctx.modelParts;
    ctx.modelParts = [];
    if (ctx.modelStart !== null && t >= ctx.modelStart) {
      segments.push(this.modelStep(ctx, ctx.modelStart, t));
    }
    ctx.modelStart = null;
    for (const segment of segments) {
      for (const flag of flags) if (!segment.flags.includes(flag)) segment.flags.push(flag);
    }
    return segments;
  }
  modelStep(ctx, start, end) {
    const step = {
      id: this.id("model"),
      parentId: ctx.parentId,
      kind: "model",
      startMs: start,
      endMs: end,
      flags: []
    };
    if (ctx.agentId) step.agentId = ctx.agentId;
    return this.push(step);
  }
  preTool(e) {
    const ctx = this.ctxFor(e);
    if (!ctx.agentId) this.ensureTurn(e.t);
    let producers = [];
    if (ctx.modelStart !== null || ctx.modelParts.length > 0) {
      producers = this.closeModel(ctx, e.t, []);
    } else if (ctx.batchOpen && ctx.lastModel) {
      producers = [ctx.lastModel];
    }
    const step = {
      id: e.tuid ?? this.id("tool"),
      parentId: ctx.parentId,
      kind: "tool",
      startMs: e.t,
      endMs: e.t,
      flags: e.bg ? ["background"] : []
    };
    if (e.tool) step.tool = e.tool;
    if (e.cmd) step.command = e.cmd;
    if (e.files) step.files = e.files;
    if (e.sub) step.agentType = e.sub;
    if (e.bgid) step.backgroundId = e.bgid;
    if (ctx.agentId) step.agentId = ctx.agentId;
    for (const producer of producers) (producer.produces ??= []).push(step.id);
    if (producers.length > 0) ctx.lastModel = producers[producers.length - 1] ?? null;
    this.push(step);
    this.inputHash.set(step, e.ih);
    ctx.open.set(step.id, step);
    ctx.batchOpen = true;
    if (e.tool && AGENT_TOOLS.has(e.tool)) this.agentCalls.push(step);
  }
  findOpen(id) {
    for (const ctx of this.ctxs.values()) {
      const step = ctx.open.get(id);
      if (step) return { ctx, step };
    }
    return void 0;
  }
  permission(e) {
    const ctx = this.ctxFor(e);
    const candidates = [...ctx.open.values()].filter((s) => s.tool === e.tool).reverse();
    const step = candidates.find((s) => this.inputHash.get(s) === e.ih) ?? candidates[0];
    if (!step) return;
    if (!step.flags.includes("approval")) step.flags.push("approval");
    this.approvalAt.set(step, e.t);
  }
  denied(e) {
    const found = e.tuid ? this.findOpen(e.tuid) : void 0;
    if (!found) return;
    found.step.endMs = e.t;
    found.step.ok = false;
    found.step.flags.push("denied");
    this.toolClosed(found.ctx, found.step, e.t);
  }
  postTool(e) {
    const found = e.tuid ? this.findOpen(e.tuid) : void 0;
    let ctx;
    let step;
    if (found) {
      ({ ctx, step } = found);
    } else {
      ctx = this.ctxFor(e);
      if (!ctx.agentId) this.ensureTurn(e.t);
      if (ctx.modelStart !== null) this.closeModel(ctx, e.t - (e.dur ?? 0), []);
      step = this.push({
        id: e.tuid ?? this.id("tool"),
        parentId: ctx.parentId,
        kind: "tool",
        startMs: e.t - (e.dur ?? 0),
        endMs: e.t,
        flags: []
      });
      if (e.tool) step.tool = e.tool;
      if (ctx.agentId) step.agentId = ctx.agentId;
      ctx.open.set(step.id, step);
    }
    step.endMs = Math.max(step.startMs, e.t);
    step.ok = e.ok === true && !e.intr;
    if (e.intr && !step.flags.includes("interrupted")) step.flags.push("interrupted");
    if (e.dur !== void 0) step.runMs = Math.min(e.dur, step.endMs - step.startMs);
    if (e.code !== void 0) step.exitCode = e.code;
    if (e.bgid) step.backgroundId = e.bgid;
    if (e.child) this.linkSubagent(e.child, step);
    const approvedAt = this.approvalAt.get(step);
    if (approvedAt !== void 0) {
      const total = step.endMs - step.startMs;
      step.waitMs = step.runMs !== void 0 ? total - step.runMs : Math.max(0, step.endMs - approvedAt);
    }
    this.toolClosed(ctx, step, e.t);
  }
  toolClosed(ctx, step, t) {
    ctx.open.delete(step.id);
    ctx.lastToolEnd = Math.max(ctx.lastToolEnd ?? t, t);
    if (ctx.open.size === 0) ctx.modelStart = t;
  }
  batchDone(e) {
    const ctx = this.ctxFor(e);
    const ids = new Set(e.ids ?? []);
    if (ids.size > 1) {
      for (const step of this.steps) {
        if (step.kind === "tool" && ids.has(step.id) && !step.flags.includes("parallel")) {
          step.flags.push("parallel");
        }
      }
    }
    ctx.batchOpen = false;
    if (ctx.open.size === 0 && ctx.modelStart === null) ctx.modelStart = ctx.lastToolEnd ?? e.t;
  }
  openSubagent(agentId, agentType, t) {
    const existing2 = this.subagents.get(agentId);
    if (existing2) return existing2;
    const unlinked = [...this.agentCalls].reverse().filter((c) => !this.linkedCalls.has(c.id));
    const call = unlinked.find((c) => c.agentType === agentType) ?? unlinked[0];
    const step = {
      id: `agent:${agentId}`,
      parentId: call?.id ?? this.turn?.id ?? null,
      kind: "subagent",
      startMs: t,
      endMs: t,
      flags: call?.flags.includes("background") ? ["background"] : [],
      agentId
    };
    if (agentType) step.agentType = agentType;
    if (call) this.linkedCalls.add(call.id);
    this.subagents.set(agentId, step);
    this.ctxs.set(agentId, this.newCtx(agentId, step.id));
    return this.push(step);
  }
  /** PostToolUse of an Agent call names the subagent it ran; fix the link if the guess was wrong. */
  linkSubagent(agentId, call) {
    const sub = this.subagents.get(agentId);
    if (!sub || sub.parentId === call.id) return;
    if (sub.parentId) this.linkedCalls.delete(sub.parentId);
    this.linkedCalls.add(call.id);
    sub.parentId = call.id;
  }
  subagentStart(e) {
    if (!e.aid) return;
    const seen = this.ctxs.has(e.aid);
    const sub = this.openSubagent(e.aid, e.at, e.t);
    const ctx = this.ctxs.get(e.aid);
    if (!seen && ctx) ctx.modelStart = e.t;
    sub.startMs = Math.min(sub.startMs, e.t);
  }
  subagentStop(e) {
    if (!e.aid) return;
    const ctx = this.ctxs.get(e.aid);
    const sub = this.subagents.get(e.aid);
    if (ctx) {
      this.closeModel(ctx, e.t, ["answer"]);
      this.closeOpenTools(ctx, e.t, "unfinished");
    }
    if (sub) sub.endMs = Math.max(sub.endMs, e.t);
  }
  stop(e) {
    const flags = e.e === "StopFailure" ? ["answer", "api-error"] : ["answer"];
    this.closeModel(this.main, e.t, flags);
    this.closeOpenTools(this.main, e.t, "unfinished");
    this.closeTurn(e.t);
  }
  compactStart(t) {
    if (this.turn && this.main.modelStart !== null) {
      this.main.modelParts.push(this.modelStep(this.main, this.main.modelStart, t));
      this.main.modelStart = null;
    }
    this.compaction = this.push({
      id: this.id("compact"),
      parentId: this.turn?.id ?? null,
      kind: "compact",
      startMs: t,
      endMs: t,
      flags: []
    });
    this.compactions.push(this.compaction);
  }
  compactEnd(t) {
    if (!this.compaction) return;
    this.compaction.endMs = t;
    this.compaction = null;
    if (this.turn && this.main.open.size === 0) this.main.modelStart = t;
  }
  closeOpenTools(ctx, t, flag) {
    for (const step of ctx.open.values()) {
      step.endMs = Math.max(step.startMs, t);
      if (!step.flags.includes(flag)) step.flags.push(flag);
    }
    ctx.open.clear();
  }
  /** Session end, or end of data: close everything still open at t. */
  closeAll(t) {
    if (this.compaction) this.compactEnd(t);
    for (const [key, ctx] of this.ctxs) {
      if (key === "main") continue;
      this.closeModel(ctx, t, ["unfinished"]);
      this.closeOpenTools(ctx, t, "unfinished");
      const sub = this.subagents.get(key);
      if (sub && sub.endMs === sub.startMs && t > sub.startMs) sub.endMs = t;
    }
    if (this.turn) {
      this.closeModel(this.main, t, ["unfinished"]);
      this.closeOpenTools(this.main, t, "unfinished");
      this.closeTurn(t);
    }
  }
};

// src/classify/glob.ts
function globToRegExp(glob) {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        const slash = glob[i + 2] === "/";
        out += slash ? "(?:.*/)?" : ".*";
        i += slash ? 2 : 1;
      } else {
        out += "[^/]*";
      }
    } else if (c === "?") {
      out += "[^/]";
    } else if (c === "{") {
      const end = glob.indexOf("}", i);
      if (end === -1) {
        out += "\\{";
        continue;
      }
      const options = glob.slice(i + 1, end).split(",").map(escapeLiteral);
      out += `(?:${options.join("|")})`;
      i = end;
    } else {
      out += escapeLiteral(c);
    }
  }
  return new RegExp(`(?:^|/)${out}$`);
}
function escapeLiteral(text) {
  return text.replace(/[.+^${}()|[\]\\]/g, "\\$&");
}
function matchesAny(file, patterns) {
  const normal = file.replace(/\\/g, "/");
  return patterns.some((p) => p.test(normal));
}

// src/classify/resolve.ts
var import_yaml = __toESM(require_dist(), 1);
import { existsSync, readFileSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";

// src/classify/shell.ts
var OPERATORS = ["&&", "||", "|&", ";;", ";", "|", "&", "\n", "(", ")"];
var REDIRECT_OP = /^(>>|>\||>&|>|<<<|<<-|<<|<>|<&|<)/;
var TEMP = /^(\/tmp\/|\/private\/tmp\/|\/var\/folders\/|\$TMPDIR|\$\{TMPDIR\})/;
function stripHeredocs(text) {
  if (!text.includes("<<")) return text;
  const lines = text.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    out.push(line);
    const tags = [...line.matchAll(/<<-?\s*(?:'([^']+)'|"([^"]+)"|\\?([A-Za-z_][A-Za-z0-9_]*))/g)].map((m) => m[1] ?? m[2] ?? m[3]).filter((tag) => Boolean(tag));
    for (const tag of tags) {
      while (i + 1 < lines.length && (lines[i + 1] ?? "").trim() !== tag) i++;
      if (i + 1 < lines.length) i++;
    }
  }
  return out.join("\n");
}
function tokenize(text) {
  const tokens2 = [];
  let word = "";
  let quoted = false;
  let inWord = false;
  const flush = () => {
    if (inWord) tokens2.push({ kind: "word", value: word, quoted });
    word = "";
    quoted = false;
    inWord = false;
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "\\") {
      if (text[i + 1] !== "\n") {
        word += text[i + 1] ?? "";
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
      word += text.slice(i + 1, j).replace(/\\(["\\$`])/g, "$1");
      quoted = inWord = true;
      i = j;
      continue;
    }
    if (c === "$" && text[i + 1] === "(") {
      const end = closingParen(text, i + 1);
      word += text.slice(i, end + 1);
      inWord = true;
      i = end;
      continue;
    }
    if (c === "`") {
      const end = text.indexOf("`", i + 1);
      const stop = end === -1 ? text.length : end;
      word += text.slice(i, stop + 1);
      inWord = true;
      i = stop;
      continue;
    }
    if (c === "#" && !inWord) {
      while (i + 1 < text.length && text[i + 1] !== "\n") i++;
      continue;
    }
    if (c === " " || c === "	" || c === "\r") {
      flush();
      continue;
    }
    if (c === ">" || c === "<" || c === "&" && text[i + 1] === ">") {
      let fd = "";
      if (inWord && /^\d+$/.test(word)) {
        fd = word;
        word = "";
        inWord = false;
      } else {
        flush();
      }
      let j = i;
      let op = "";
      if (text[j] === "&") {
        op = "&";
        j++;
      }
      const match = REDIRECT_OP.exec(text.slice(j));
      const symbol = match?.[1] ?? text[j];
      tokens2.push({ kind: "redirect", value: fd + op + symbol });
      i = j + symbol.length - 1;
      continue;
    }
    const operator = OPERATORS.find((o) => text.startsWith(o, i));
    if (operator) {
      flush();
      tokens2.push({ kind: "op", value: operator });
      i += operator.length - 1;
      continue;
    }
    word += c;
    inWord = true;
  }
  flush();
  return tokens2;
}
function closingQuote(text, open) {
  let j = open + 1;
  while (j < text.length) {
    const c = text[j];
    if (c === "\\") j += 2;
    else if (c === '"') return j;
    else if (c === "$" && text[j + 1] === "(") j = closingParen(text, j + 1) + 1;
    else if (c === "`") {
      const end = text.indexOf("`", j + 1);
      j = end === -1 ? text.length : end + 1;
    } else j++;
  }
  return text.length;
}
function closingParen(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === "\\") i++;
    else if (c === "'") {
      const end = text.indexOf("'", i + 1);
      i = end === -1 ? text.length : end;
    } else if (c === '"') i = closingQuote(text, i);
    else if (c === "(") depth++;
    else if (c === ")" && --depth === 0) return i;
  }
  return text.length - 1;
}
var LEADING_KEYWORDS = /* @__PURE__ */ new Set([
  "!",
  "{",
  "}",
  "then",
  "do",
  "else",
  "elif",
  "if",
  "while",
  "until"
]);
var SKIPPED_HEADS = /* @__PURE__ */ new Set(["fi", "done", "esac", "for", "select", "case", "function"]);
var ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*(\[[^\]]*\])?\+?=/;
function splitCommand(text) {
  const commands = [];
  let words = [];
  let writes = [];
  let piped = false;
  let redirect = null;
  const cd = [];
  const functions = /* @__PURE__ */ new Set();
  let caseDepth = 0;
  let inPattern = false;
  const end = (operator) => {
    const argv = clean(words);
    if (words[0]?.value === "function" && words[1])
      functions.add(words[1].value.replace(/\(\)$/, ""));
    if (argv.length > 0 && !functions.has(argv[0])) {
      commands.push({ argv, writes, cd: [...cd], piped });
      if (argv[0] === "cd" && !piped) cd.push(argv[1] ?? "~");
    }
    words = [];
    writes = [];
    piped = operator === "|" || operator === "|&";
  };
  const tokens2 = tokenize(stripHeredocs(text));
  for (let t = 0; t < tokens2.length; t++) {
    const token = tokens2[t];
    if (inPattern) {
      if (token.kind === "word" && token.value === "esac") {
        caseDepth--;
        inPattern = false;
      } else if (token.kind === "op" && token.value === ")") {
        inPattern = false;
      }
      continue;
    }
    if (token.kind === "word" && token.value === "esac" && words.length === 0 && caseDepth > 0) {
      caseDepth--;
      continue;
    }
    if (token.kind === "word" && token.value === "in" && words.length === 2 && words[0]?.value === "case") {
      words = [];
      caseDepth++;
      inPattern = true;
      continue;
    }
    if (token.kind === "op" && token.value === "(" && words.length === 1 && tokens2[t + 1]?.kind === "op" && tokens2[t + 1]?.value === ")") {
      functions.add(words[0]?.value);
      words = [];
      t++;
      continue;
    }
    if (redirect !== null) {
      const op = redirect;
      redirect = null;
      if (token.kind === "word") {
        const toFile = op.includes(">") && !op.endsWith("&") && !op.endsWith(">&");
        const target = token.value;
        if (toFile && !target.startsWith("/dev/") && !/^&?\d+$/.test(target) && !TEMP.test(target)) {
          writes.push(target);
        }
        continue;
      }
    }
    if (token.kind === "redirect") {
      redirect = token.value;
      continue;
    }
    if (token.kind === "op") {
      end(token.value);
      if (token.value === ";;" && caseDepth > 0) inPattern = true;
      continue;
    }
    words.push({ value: token.value, quoted: token.quoted });
  }
  end(null);
  return commands;
}
function clean(words) {
  let start = 0;
  const at = (i) => words[i];
  while (start < words.length && !at(start)?.quoted && LEADING_KEYWORDS.has(at(start)?.value ?? "")) {
    start++;
  }
  const head = at(start);
  if (head && !head.quoted && SKIPPED_HEADS.has(head.value)) return [];
  while (start < words.length && ASSIGNMENT.test(at(start)?.value ?? "")) {
    start++;
  }
  return words.slice(start).map((w) => w.value);
}
var WRAPPERS = {
  sudo: { valueOptions: ["-u", "-g", "-C", "-D", "-h", "-p", "-r", "-t", "-U"] },
  doas: { valueOptions: ["-u", "-C"] },
  time: {},
  command: {},
  builtin: {},
  exec: { valueOptions: ["-a"] },
  nohup: {},
  nice: { valueOptions: ["-n"] },
  ionice: { valueOptions: ["-c", "-n", "-p"] },
  stdbuf: { valueOptions: ["-i", "-o", "-e"] },
  unbuffer: {},
  caffeinate: { valueOptions: ["-t", "-w"] },
  "xvfb-run": { valueOptions: ["-n", "-s", "-f", "-e", "-p", "-w"] },
  timeout: { valueOptions: ["-s", "-k", "--signal", "--kill-after"], positional: 1 },
  gtimeout: { valueOptions: ["-s", "-k", "--signal", "--kill-after"], positional: 1 },
  watch: { valueOptions: ["-n", "-d", "--interval"] },
  xargs: {
    valueOptions: [
      "-n",
      "-I",
      "-i",
      "-P",
      "-L",
      "-l",
      "-d",
      "-s",
      "-E",
      "-a",
      "--max-args",
      "--max-procs",
      "--delimiter",
      "--arg-file"
    ]
  },
  npx: { valueOptions: ["-p", "--package", "-c", "--call", "--node-options"] },
  pnpx: { valueOptions: ["-p", "--package"] },
  bunx: { valueOptions: ["-p", "--package"] },
  uvx: { valueOptions: ["--from", "--with", "--python", "-p"] },
  "cross-env": { assignments: true },
  "cross-env-shell": { assignments: true },
  dotenv: { valueOptions: ["-e", "-c", "-v"], stopAt: "--" },
  "env-cmd": { valueOptions: ["-f", "-e", "--file", "--environments"] },
  c8: {
    valueOptions: ["--reporter", "-r", "--reports-dir", "-o", "--include", "--exclude", "--src"]
  },
  nyc: {
    valueOptions: ["--reporter", "-r", "--report-dir", "--include", "--exclude", "--extension"]
  },
  chronic: {},
  corepack: {}
};
var WRAPPER_PAIRS = {
  npm: {
    exec: ["-c", "--call", "-p", "--package", "-w", "--workspace"],
    x: ["-c", "-p", "--package"]
  },
  pnpm: { exec: ["-C", "--dir", "--filter", "-F"], dlx: ["--package", "-p"] },
  yarn: { exec: [], dlx: ["-p", "--package"] },
  bun: { x: ["-p", "--package"] },
  uv: {
    run: [
      "--with",
      "--python",
      "-p",
      "--package",
      "--project",
      "--directory",
      "--extra",
      "--group",
      "--env-file",
      "--with-requirements",
      "--from"
    ]
  },
  poetry: { run: [] },
  pipenv: { run: [] },
  pdm: { run: [] },
  rye: { run: [] },
  hatch: { run: [] },
  conda: { run: ["-n", "--name", "-p", "--prefix"] },
  mamba: { run: ["-n", "--name", "-p", "--prefix"] },
  bundle: { exec: [] },
  rbenv: { exec: [] },
  pyenv: { exec: [] },
  asdf: { exec: [] },
  mise: { exec: [], x: [] },
  direnv: { exec: [] },
  fnm: { exec: ["--using"] },
  nvm: { exec: [] },
  volta: { run: ["--node", "--npm", "--yarn", "--pnpm"] },
  op: { run: ["--env-file"] },
  doppler: { run: ["-p", "--project", "-c", "--config"] },
  infisical: { run: ["--env", "--path", "--projectId"] }
};
var GLOBAL_VALUE_OPTIONS = {
  pnpm: ["-C", "--dir", "--filter", "-F"],
  npm: ["--prefix", "-w", "--workspace"],
  yarn: ["--cwd"],
  uv: ["--directory", "--project"],
  conda: ["-n", "--name"],
  mamba: ["-n", "--name"]
};
var PYTHON = /^(python|python[23](\.\d+)?|py|pypy3?)$/;
var SHELLS = /* @__PURE__ */ new Set(["sh", "bash", "zsh", "dash", "ksh"]);
function programName(word) {
  let name = word.replace(/\\/g, "/").split("/").pop() ?? word;
  name = name.replace(/\.(exe|cmd|bat)$/i, "");
  if (name === "gradlew") return "gradle";
  if (name === "mvnw") return "mvn";
  return name;
}
function unwrap(input) {
  let argv = [...input];
  const wrappers = [];
  for (let guard = 0; guard < 8 && argv.length > 0; guard++) {
    const program = programName(argv[0]);
    const rest = argv.slice(1);
    if (program === "env") {
      const after = skipOptions(
        rest,
        ["-u", "--unset", "-C", "--chdir", "-S", "--split-string"],
        true
      );
      if (after.length === 0) break;
      wrappers.push("env");
      argv = after;
      continue;
    }
    if (PYTHON.test(program) && rest[0] === "-m" && rest[1]) {
      wrappers.push(`${program} -m`);
      argv = rest.slice(1);
      continue;
    }
    if (program === "coverage" && rest[0] === "run") {
      const after = skipOptions(
        rest.slice(1),
        ["--rcfile", "--source", "--omit", "--include", "--concurrency"],
        false
      );
      if (after.length === 0) break;
      wrappers.push("coverage run");
      argv = after[0] === "-m" ? after.slice(1) : ["python", ...after];
      continue;
    }
    if (SHELLS.has(program)) break;
    const wrapper = WRAPPERS[program];
    if (wrapper && !(program === "command" && /^-[vV]$/.test(rest[0] ?? ""))) {
      let after = skipOptions(rest, wrapper.valueOptions ?? [], wrapper.assignments ?? false);
      if (wrapper.stopAt && after[0] === wrapper.stopAt) after = after.slice(1);
      after = after.slice(wrapper.positional ?? 0);
      if (after[0] === "--") after = after.slice(1);
      if (after.length === 0) break;
      wrappers.push(program);
      argv = after;
      continue;
    }
    const pair = WRAPPER_PAIRS[program];
    const sub = pair ? firstPositional(rest, GLOBAL_VALUE_OPTIONS[program] ?? []) : -1;
    const subName = sub >= 0 ? rest[sub] : void 0;
    const subOptions = pair && subName !== void 0 ? pair[subName] : void 0;
    if (subOptions) {
      let after = skipOptions(rest.slice(sub + 1), subOptions, false);
      if (["fnm", "nvm", "mise", "asdf"].includes(program)) {
        while (after.length > 1 && /^(\d|[a-z0-9-]+@)/.test(after[0] ?? "")) after = after.slice(1);
      }
      if (after[0] === "--") after = after.slice(1);
      if (program === "direnv") after = after.slice(1);
      if (after.length === 0) break;
      wrappers.push(`${program} ${subName}`);
      argv = after;
      continue;
    }
    break;
  }
  return { argv, wrappers };
}
function skipOptions(args, valueOptions, assignments) {
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === "--") break;
    if (assignments && ASSIGNMENT.test(arg)) {
      i++;
      continue;
    }
    if (!arg.startsWith("-") || arg === "-") break;
    i += valueOptions.includes(arg) ? 2 : 1;
  }
  return args.slice(i);
}
function firstPositional(args, valueOptions) {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (valueOptions.includes(arg)) {
      i++;
      continue;
    }
    if (!arg.startsWith("-")) return i;
  }
  return -1;
}
function shellString(argv) {
  if (!SHELLS.has(programName(argv[0] ?? ""))) return void 0;
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (/^-[a-z]*c[a-z]*$/.test(arg)) return argv[i + 1];
    if (!arg.startsWith("-")) return void 0;
  }
  return void 0;
}
function scriptFile(argv) {
  const first = argv[0] ?? "";
  if (SHELLS.has(programName(first))) {
    const file = argv.slice(1).find((a) => !a.startsWith("-"));
    return file && !shellString(argv) ? file : void 0;
  }
  return /^(\.{0,2}\/|[\w.-]+\/)[^\s]*\.(sh|bash)$/.test(first) || /^\.\/[\w./-]+$/.test(first) ? first : void 0;
}

// src/classify/resolve.ts
var MAX_FILE = 512 * 1024;
function diskFiles() {
  const cache = /* @__PURE__ */ new Map();
  return {
    read(file) {
      if (cache.has(file)) return cache.get(file);
      let text;
      try {
        if (existsSync(file) && statSync(file).isFile() && statSync(file).size <= MAX_FILE) {
          text = readFileSync(file, "utf8");
        }
      } catch {
        text = void 0;
      }
      cache.set(file, text);
      return text;
    }
  };
}
function findUp(start, names, files) {
  let dir = path.resolve(start);
  for (let i = 0; i < 16; i++) {
    for (const name of names) {
      const file = path.join(dir, name);
      const text = files.read(file);
      if (text !== void 0) return { dir, file, text };
    }
    const parent = path.dirname(dir);
    if (parent === dir) return void 0;
    dir = parent;
  }
  return void 0;
}
function resolvePath(cwd, target) {
  if (target === "~" || target.startsWith("~/")) return path.join(os.homedir(), target.slice(1));
  return path.resolve(cwd, target);
}
function optionValue(args, names) {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (names.includes(arg)) return args[i + 1];
    for (const name of names) {
      if (name.startsWith("--") && arg.startsWith(name + "=")) return arg.slice(name.length + 1);
      if (!name.startsWith("--") && arg.startsWith(name) && arg.length > name.length)
        return arg.slice(name.length);
    }
  }
  return void 0;
}
var NPM_ALIASES = {
  t: "test",
  tst: "test",
  test: "test",
  start: "start",
  stop: "stop",
  restart: "restart"
};
var NPM_RUN = /* @__PURE__ */ new Set(["run", "run-script", "rum", "urn"]);
var PNPM_BUILTINS = /* @__PURE__ */ new Set([
  "add",
  "install",
  "i",
  "update",
  "up",
  "upgrade",
  "remove",
  "rm",
  "uninstall",
  "un",
  "link",
  "ln",
  "unlink",
  "import",
  "rebuild",
  "rb",
  "prune",
  "fetch",
  "patch",
  "patch-commit",
  "patch-remove",
  "audit",
  "list",
  "ls",
  "ll",
  "outdated",
  "why",
  "licenses",
  "exec",
  "dlx",
  "create",
  "init",
  "publish",
  "pack",
  "store",
  "server",
  "env",
  "setup",
  "config",
  "c",
  "get",
  "set",
  "bin",
  "root",
  "dedupe",
  "deploy",
  "doctor",
  "self-update",
  "approve-builds",
  "ignored-builds",
  "cat-file",
  "cat-index",
  "find-hash",
  "recursive",
  "help"
]);
var YARN_BUILTINS = /* @__PURE__ */ new Set([
  "add",
  "install",
  "remove",
  "upgrade",
  "up",
  "run",
  "exec",
  "dlx",
  "workspace",
  "workspaces",
  "why",
  "info",
  "list",
  "config",
  "cache",
  "init",
  "create",
  "global",
  "link",
  "unlink",
  "pack",
  "publish",
  "version",
  "versions",
  "outdated",
  "audit",
  "bin",
  "dedupe",
  "set",
  "plugin",
  "constraints",
  "npm",
  "node",
  "explain",
  "patch",
  "patch-commit",
  "rebuild",
  "search",
  "stage",
  "unplug",
  "import",
  "help",
  "login",
  "logout",
  "owner",
  "tag",
  "team",
  "check",
  "autoclean",
  "licenses",
  "generate-lock-entry",
  "policies"
]);
var BUN_BUILTINS = /* @__PURE__ */ new Set([
  "test",
  "build",
  "install",
  "i",
  "add",
  "a",
  "remove",
  "rm",
  "update",
  "outdated",
  "link",
  "unlink",
  "pm",
  "x",
  "create",
  "init",
  "upgrade",
  "publish",
  "patch",
  "repl",
  "exec",
  "audit",
  "info",
  "why",
  "help"
]);
var PNPM_VALUE_OPTIONS = [
  "-C",
  "--dir",
  "--filter",
  "-F",
  "--workspace-concurrency",
  "--reporter",
  "--loglevel",
  "--test-pattern"
];
var YARN_VALUE_OPTIONS = ["--cwd"];
var NPM_VALUE_OPTIONS = ["--prefix", "-w", "--workspace", "--loglevel", "--userconfig"];
function packageScripts(cwd, files) {
  const found = findUp(cwd, ["package.json"], files);
  if (!found) return void 0;
  try {
    const pkg = JSON.parse(found.text);
    const scripts = {};
    for (const [name, body] of Object.entries(pkg.scripts ?? {}))
      if (typeof body === "string") scripts[name] = body;
    return { scripts, dir: found.dir };
  } catch {
    return void 0;
  }
}
function scriptCommands(scripts, name, prePost) {
  const main2 = scripts[name];
  if (!prePost) return [main2];
  return [scripts[`pre${name}`], main2, scripts[`post${name}`]].filter(
    (c) => typeof c === "string"
  );
}
function resolveScript(runner, name, rest, cwd, files, options) {
  if (options.workspace) return { kind: "script-name", runner, name, rest };
  const pkg = packageScripts(cwd, files);
  if (pkg && typeof pkg.scripts[name] === "string") {
    return {
      kind: "script",
      runner,
      name,
      commands: scriptCommands(pkg.scripts, name, options.prePost),
      cwd: pkg.dir
    };
  }
  if (!pkg) return { kind: "script-name", runner, name, rest };
  if (options.runsBins) return { kind: "bin", argv: [name, ...rest] };
  return { kind: "script-name", runner, name, rest };
}
function resolveNpm(args, cwd, files) {
  const prefix = optionValue(args, ["--prefix"]);
  const dir = prefix ? resolvePath(cwd, prefix) : cwd;
  const workspace = optionValue(args, ["-w", "--workspace"]) !== void 0 || args.includes("--workspaces") || args.includes("-ws");
  const i = firstPositional(args, NPM_VALUE_OPTIONS);
  if (i < 0) return void 0;
  const sub = args[i];
  if (NPM_RUN.has(sub)) {
    const j = firstPositional(args.slice(i + 1), []);
    if (j < 0) return void 0;
    const name = args[i + 1 + j];
    return resolveScript("npm", name, args.slice(i + 2 + j), dir, files, {
      prePost: true,
      runsBins: false,
      workspace
    });
  }
  const alias = NPM_ALIASES[sub];
  if (alias)
    return resolveScript("npm", alias, args.slice(i + 1), dir, files, {
      prePost: true,
      runsBins: false,
      workspace
    });
  return void 0;
}
function resolvePnpm(args, cwd, files) {
  const dirOption = optionValue(args, ["-C", "--dir"]);
  const dir = dirOption ? resolvePath(cwd, dirOption) : cwd;
  const workspace = args.includes("-r") || args.includes("--recursive") || optionValue(args, ["--filter", "-F"]) !== void 0;
  const i = firstPositional(args, PNPM_VALUE_OPTIONS);
  if (i < 0) return void 0;
  const sub = args[i];
  if (sub === "run" || sub === "run-script") {
    const j = firstPositional(args.slice(i + 1), PNPM_VALUE_OPTIONS);
    if (j < 0) return void 0;
    return resolveScript("pnpm", args[i + 1 + j], args.slice(i + 2 + j), dir, files, {
      prePost: false,
      runsBins: false,
      workspace
    });
  }
  if (sub === "test" || sub === "t")
    return resolveScript("pnpm", "test", args.slice(i + 1), dir, files, {
      prePost: false,
      runsBins: false,
      workspace
    });
  if (PNPM_BUILTINS.has(sub)) return void 0;
  return resolveScript("pnpm", sub, args.slice(i + 1), dir, files, {
    prePost: false,
    runsBins: true,
    workspace
  });
}
function resolveYarn(args, cwd, files) {
  const cwdOption = optionValue(args, ["--cwd"]);
  const dir = cwdOption ? resolvePath(cwd, cwdOption) : cwd;
  const i = firstPositional(args, YARN_VALUE_OPTIONS);
  if (i < 0) return void 0;
  const sub = args[i];
  if (sub === "run") {
    const name = args[i + 1];
    return name ? resolveScript("yarn", name, args.slice(i + 2), dir, files, {
      prePost: true,
      runsBins: true,
      workspace: false
    }) : void 0;
  }
  if (sub === "workspace") {
    const name = args[i + 2];
    return name ? {
      kind: "script-name",
      runner: "yarn",
      name: name === "run" ? args[i + 3] ?? name : name,
      rest: []
    } : void 0;
  }
  if (sub === "workspaces") {
    const run = args.indexOf("run", i);
    const name = run >= 0 ? args[run + 1] : void 0;
    return name ? { kind: "script-name", runner: "yarn", name, rest: [] } : void 0;
  }
  if (YARN_BUILTINS.has(sub)) return void 0;
  return resolveScript("yarn", sub, args.slice(i + 1), dir, files, {
    prePost: true,
    runsBins: true,
    workspace: false
  });
}
function resolveBun(args, cwd, files) {
  const i = firstPositional(args, ["--cwd"]);
  if (i < 0) return void 0;
  const sub = args[i];
  const name = sub === "run" ? args[i + 1] : sub;
  if (!name || sub !== "run" && BUN_BUILTINS.has(sub)) return void 0;
  if (/\.(m?[jt]sx?|cjs|cts)$/.test(name)) return void 0;
  const pkg = packageScripts(cwd, files);
  if (pkg && typeof pkg.scripts[name] === "string") {
    return {
      kind: "script",
      runner: "bun",
      name,
      commands: scriptCommands(pkg.scripts, name, true),
      cwd: pkg.dir
    };
  }
  return sub === "run" ? { kind: "script-name", runner: "bun", name, rest: args.slice(i + 2) } : void 0;
}
function resolveDeno(args, cwd, files) {
  if (args[0] !== "task" || !args[1]) return void 0;
  const name = args[1];
  const found = findUp(cwd, ["deno.json", "deno.jsonc"], files);
  if (found) {
    try {
      const config = JSON.parse(found.text.replace(/^\s*\/\/.*$/gm, ""));
      const task = config.tasks?.[name];
      const body = typeof task === "string" ? task : typeof task?.command === "string" ? task.command : void 0;
      if (body) return { kind: "script", runner: "deno", name, commands: [body], cwd: found.dir };
    } catch {
    }
  }
  return { kind: "script-name", runner: "deno", name, rest: args.slice(2) };
}
function parseMakefile(text) {
  const lines = text.replace(/\\\n/g, " ").split("\n");
  const vars = /* @__PURE__ */ new Map();
  const rules = /* @__PURE__ */ new Map();
  let first;
  let current = [];
  for (const raw of lines) {
    if (raw.startsWith("	")) {
      for (const rule2 of current) rule2.recipe.push(raw.slice(1));
      continue;
    }
    const line = raw.replace(/(^|\s)#.*$/, "").trimEnd();
    if (!line.trim()) continue;
    const assign = /^(?:export\s+|override\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*(:{1,3}=|\?=|\+=|!=|=)\s*(.*)$/.exec(
      line
    );
    if (assign) {
      const [, name, op, value] = assign;
      vars.set(name, op === "+=" ? `${vars.get(name) ?? ""} ${value}`.trim() : value);
      current = [];
      continue;
    }
    const rule = /^([^:=#]+?)\s*::?\s*(?![=])(.*)$/.exec(line);
    if (rule) {
      const [, targetsText, depsText] = rule;
      const recipeAfterSemicolon = depsText.includes(";") ? depsText.slice(depsText.indexOf(";") + 1).trim() : "";
      const deps = (depsText.split(";")[0] ?? "").split(/\s+/).filter((d) => d && !d.startsWith("|"));
      current = [];
      for (const target of targetsText.trim().split(/\s+/)) {
        if (target.includes("%") || target.startsWith(".")) continue;
        const entry = rules.get(target) ?? { deps: [], recipe: [] };
        entry.deps.push(...deps);
        if (recipeAfterSemicolon) entry.recipe.push(recipeAfterSemicolon);
        rules.set(target, entry);
        current.push(entry);
        first ??= target;
      }
      continue;
    }
    current = [];
  }
  const expand = (text2, depth = 0) => depth > 5 ? text2 : text2.replace(/\$\$/g, "\uE000").replace(/\$\(MAKE\)|\$\{MAKE\}/g, "make").replace(/\$\(shell [^)]*\)/g, "").replace(
    /\$[({]([A-Za-z_][A-Za-z0-9_.-]*)[)}]/g,
    (_m, name) => expand(vars.get(name) ?? "", depth + 1)
  ).replace(/\uE000/g, "$");
  for (const rule of rules.values()) {
    rule.recipe = rule.recipe.map(
      (line) => expand(line).replace(/^[\s@+-]+/, "").trim()
    ).filter(Boolean);
  }
  return { rules, ...first ? { first } : {} };
}
function recipeFor(rules, target, depth = 0) {
  const rule = rules.get(target);
  if (!rule) return void 0;
  if (rule.recipe.length > 0 || depth > 3) return rule.recipe;
  return rule.deps.flatMap((dep) => recipeFor(rules, dep, depth + 1) ?? []);
}
function resolveMake(args, cwd, files) {
  if (args.some(
    (a) => [
      "-n",
      "--dry-run",
      "--just-print",
      "--recon",
      "-q",
      "--question",
      "-p",
      "--print-data-base"
    ].includes(a)
  )) {
    return void 0;
  }
  const dirOption = optionValue(args, ["-C", "--directory"]);
  const dir = dirOption ? resolvePath(cwd, dirOption) : cwd;
  const fileOption = optionValue(args, ["-f", "--file", "--makefile"]);
  const valueOptions = [
    "-C",
    "--directory",
    "-f",
    "--file",
    "--makefile",
    "-j",
    "--jobs",
    "-l",
    "--load-average",
    "-I",
    "--include-dir",
    "-o",
    "-W"
  ];
  const targets = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (valueOptions.includes(arg)) {
      if (arg !== "-j" || /^\d+$/.test(args[i + 1] ?? "")) i++;
      continue;
    }
    if (arg.startsWith("-") || arg.includes("=")) continue;
    targets.push(arg);
  }
  const text = fileOption ? files.read(resolvePath(dir, fileOption)) : files.read(path.join(dir, "GNUmakefile")) ?? files.read(path.join(dir, "makefile")) ?? files.read(path.join(dir, "Makefile"));
  if (text === void 0)
    return { kind: "make-name", ...targets[0] ? { target: targets[0] } : {} };
  const parsed = parseMakefile(text);
  const wanted = targets.length > 0 ? targets : parsed.first ? [parsed.first] : [];
  if (wanted.length === 0) return { kind: "make-name" };
  const commands = [];
  for (const target of wanted) {
    const recipe = recipeFor(parsed.rules, target);
    if (recipe === void 0) return { kind: "make-name", target };
    commands.push(...recipe);
  }
  return { kind: "make", target: wanted.join(" "), commands, cwd: dir };
}
var GRADLE_VALUE_OPTIONS = [
  "-p",
  "--project-dir",
  "-x",
  "--exclude-task",
  "-I",
  "--init-script",
  "-c",
  "--settings-file",
  "-b",
  "--build-file",
  "--console",
  "--warning-mode",
  "--max-workers",
  "-g",
  "--gradle-user-home",
  "--project-cache-dir",
  "-D",
  "-P",
  "--priority",
  "--include-build"
];
var MAVEN_VALUE_OPTIONS = [
  "-pl",
  "--projects",
  "-f",
  "--file",
  "-s",
  "--settings",
  "-gs",
  "-P",
  "--activate-profiles",
  "-T",
  "--threads",
  "-rf",
  "--resume-from",
  "-l",
  "--log-file",
  "-t",
  "--toolchains",
  "-b",
  "--builder",
  "-D",
  "-e"
];
function positionals(args, valueOptions) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (valueOptions.includes(arg)) {
      i++;
      continue;
    }
    if (!arg.startsWith("-")) out.push(arg);
  }
  return out;
}
function resolveTasks(program, args) {
  let tasks = [];
  if (program === "gradle") tasks = positionals(args, GRADLE_VALUE_OPTIONS);
  else if (program === "mvn") tasks = positionals(args, MAVEN_VALUE_OPTIONS);
  else if (program === "sbt") tasks = positionals(args, []).map((t) => t.replace(/^[^/]+\//, ""));
  else if (program === "turbo") {
    const all = positionals(args, [
      "--filter",
      "-F",
      "--concurrency",
      "--output-logs",
      "--cache-dir",
      "--graph",
      "--log-order"
    ]);
    tasks = all[0] === "run" ? all.slice(1) : all;
    if ([
      "prune",
      "login",
      "logout",
      "link",
      "unlink",
      "daemon",
      "telemetry",
      "gen",
      "ls",
      "info",
      "query",
      "scan",
      "watch"
    ].includes(tasks[0] ?? ""))
      return void 0;
  } else if (program === "nx") {
    const all = positionals(args, [
      "-p",
      "--projects",
      "-c",
      "--configuration",
      "--parallel",
      "--base",
      "--head",
      "--exclude"
    ]);
    const flag = args.findIndex((a) => a === "-t" || a === "--target" || a === "--targets");
    const inline = optionValue(args, ["--target", "--targets"]);
    if (flag >= 0) {
      const values = [];
      for (const arg of args.slice(flag + 1)) {
        if (arg.startsWith("-")) break;
        values.push(...arg.split(","));
      }
      tasks = values;
    } else if (inline) tasks = inline.split(",");
    else if (all[0] === "run" && all[1]) tasks = [all[1].split(":")[1] ?? all[1]];
    else if (all[0] && ![
      "affected",
      "run-many",
      "graph",
      "show",
      "list",
      "report",
      "reset",
      "daemon",
      "migrate",
      "g",
      "generate",
      "init",
      "add",
      "release",
      "sync",
      "format",
      "format:write",
      "format:check"
    ].includes(all[0]))
      tasks = [all[0]];
    else if (all[0] === "format:write" || all[0] === "format:check" || all[0] === "format")
      tasks = ["format"];
  }
  tasks = tasks.filter((t) => t && !t.includes("="));
  if (tasks.length === 0) return void 0;
  if (tasks.length > 1) tasks = tasks.filter((t) => t !== "clean" && !t.endsWith(":clean"));
  return { kind: "tasks", runner: program, tasks };
}
function resolveGitCommit(args, cwd, files) {
  const sub = positionals(args, ["-C", "-c", "--git-dir", "--work-tree", "--namespace"])[0];
  if (sub !== "commit" || args.includes("--no-verify") || args.includes("-n")) return void 0;
  const root = findUp(cwd, [".git/HEAD", ".git"], files)?.dir ?? cwd;
  const husky = files.read(path.join(root, ".husky", "pre-commit"));
  if (husky !== void 0)
    return { kind: "hook", name: ".husky/pre-commit", commands: [husky], cwd: root };
  const lefthook = files.read(path.join(root, "lefthook.yml")) ?? files.read(path.join(root, "lefthook.yaml"));
  if (lefthook !== void 0) {
    try {
      const doc = import_yaml.default.parse(lefthook);
      const commands = Object.values(doc?.["pre-commit"]?.commands ?? {}).map((c) => c?.run).filter((c) => typeof c === "string");
      if (commands.length > 0)
        return { kind: "hook", name: "lefthook pre-commit", commands, cwd: root };
    } catch {
    }
  }
  if (files.read(path.join(root, ".pre-commit-config.yaml")) !== void 0) {
    return { kind: "hook", name: "pre-commit", commands: ["pre-commit run"], cwd: root };
  }
  const gitHook = files.read(path.join(root, ".git", "hooks", "pre-commit"));
  if (gitHook !== void 0)
    return { kind: "hook", name: ".git/hooks/pre-commit", commands: [gitHook], cwd: root };
  return void 0;
}
function resolve(argv, cwd, files) {
  const program = programName(argv[0] ?? "");
  const args = argv.slice(1);
  switch (program) {
    case "npm":
      return resolveNpm(args, cwd, files);
    case "pnpm":
      return resolvePnpm(args, cwd, files);
    case "yarn":
      return resolveYarn(args, cwd, files);
    case "bun":
      return resolveBun(args, cwd, files);
    case "deno":
      return resolveDeno(args, cwd, files);
    case "make":
    case "gmake":
      return resolveMake(args, cwd, files);
    case "gradle":
    case "mvn":
    case "sbt":
    case "turbo":
    case "nx":
      return resolveTasks(program, args);
    case "git":
      return resolveGitCommit(args, cwd, files);
  }
  const file = scriptFile(argv);
  if (file) {
    const full = resolvePath(cwd, file);
    const text = files.read(full);
    if (text !== void 0) return { kind: "file", file, commands: [text], cwd };
  }
  return void 0;
}

// src/classify/rules.ts
var import_yaml2 = __toESM(require_dist(), 1);
import path2 from "node:path";

// raw:src/classify/default-rules.yaml
var default_rules_default = `# awf phase rules. See docs/phases.md.
#
# A repo extends these in .awf/rules.yaml, in the same format. Its rules are tried first, so it can
# also override these. Within a section the first matching rule wins: specific rules go first.
#
# Phases: lint, tests, build, exploring, writing (Writing code or Writing tests, by file), planning,
# waiting, neutral (changes nothing and doesn't count, like cd or echo).

version: 1

# Bash commands. A compound command (&&, ||, ;, |, newlines, subshells, sh -c) is split into simple
# commands. Each one is matched after wrappers (env FOO=1, sudo, time, timeout, npx, pnpm exec,
# uv run, poetry run, bundle exec, python -m, ...) are removed, and after npm/pnpm/yarn/bun scripts,
# make targets, Gradle tasks, Maven goals and git commit hooks are resolved to what they run.
#
#   program   the command's name, without its path (string or list)
#   args      leading arguments that must follow, in order, options skipped ("a|b" for either)
#   with      arguments that must all appear anywhere (--flag also matches --flag=value)
#   without   arguments that must not appear
#   only      every argument must be one of these
#   match     instead of program: a regex tested on the simple command
#   tag       an extra tag on the step, like install
#   tool      the check's name, when it isn't the program (go test is "go test")
commands:
  # --version, --help and friends only read.
  - { phase: exploring, match: '^\\S+\\s+(--version|-v|-V|--help|-h|version|help|-version|--usage)$' }

  # Lint and format
  - { phase: exploring, program: eslint, with: [--print-config] }
  - phase: lint
    program: [eslint, prettier, oxlint, standard, xo, stylelint, markdownlint, markdownlint-cli2, htmlhint, jsonlint, yamllint, hadolint, shellcheck, shfmt, actionlint, editorconfig-checker, eclint, lint-staged, commitlint, knip, depcheck, sort-package-json, syncpack, cspell]
  - { phase: lint, program: biome, args: ['check|lint|format|ci'] }
  - { phase: lint, program: ruff, args: ['check|format'] }
  - { phase: lint, program: [black, isort, flake8, pylint, mypy, pyright, basedpyright, pyflakes, pycodestyle, pydocstyle, bandit, autopep8, yapf, pyre, pytype, vulture] }
  - { phase: lint, program: [golangci-lint, gofmt, goimports, gofumpt, staticcheck, revive, errcheck, govulncheck] }
  - { phase: lint, program: go, args: ['vet|fmt'], tool: go vet }
  - { phase: lint, program: cargo, args: ['clippy|fmt|check|audit|deny|udeps'], tool: cargo clippy }
  - { phase: lint, program: [rustfmt, clippy-driver] }
  - { phase: lint, program: [ktlint, detekt, ktfmt, swiftlint, swiftformat, clang-format, clang-tidy, cpplint, cppcheck] }
  - { phase: lint, program: swift, args: ['format'], tool: swift format }
  - { phase: lint, program: dotnet, args: ['format'], tool: dotnet format }
  - { phase: lint, program: [rubocop, standardrb, erb_lint, reek, brakeman] }
  - { phase: lint, program: [phpcs, phpcbf, phpstan, psalm, php-cs-fixer, pint] }
  - { phase: lint, program: [tsc, vue-tsc], with: [--noEmit], tool: tsc --noEmit }
  - { phase: lint, program: [svelte-check, tflint, sqlfluff, checkov, ansible-lint, credo] }
  - { phase: lint, program: buf, args: ['lint|format|breaking'] }
  - { phase: lint, program: astro, args: ['check'] }
  - { phase: lint, program: terraform, args: ['fmt|validate'] }
  - { phase: lint, program: deno, args: ['lint|fmt|check'] }
  - { phase: lint, program: [flutter, dart], args: ['analyze|format'] }
  - { phase: lint, program: mix, args: ['format|credo|dialyzer'] }
  - { phase: lint, program: pre-commit, args: ['run'] }
  - { phase: lint, program: xcrun, args: ['swift-format|swiftlint'] }

  # Running tests (before Build, so a few build-like commands with test flags land here)
  - { phase: exploring, program: [jest, vitest], with: [--listTests] }
  - { phase: exploring, program: [pytest, py.test], with: [--collect-only] }
  - { phase: build, program: go, args: [test], with: [-c], tool: go test -c }
  - { phase: build, program: cargo, args: ['test|nextest'], with: [--no-run] }
  - { phase: tests, program: [jest, vitest, mocha, ava, tap, jasmine, karma, uvu, cucumber-js, wdio, testcafe, nightwatch] }
  - { phase: tests, program: playwright, args: ['test'] }
  - { phase: tests, program: cypress, args: ['run'] }
  - { phase: tests, program: node, with: [--test] }
  - { phase: tests, program: [bun, deno], args: ['test'] }
  - { phase: tests, program: [pytest, py.test, tox, nox, nose2, ward, behave] }
  - { phase: tests, program: unittest }
  - { phase: tests, program: go, args: [test], tool: go test }
  - { phase: tests, program: [gotestsum, ginkgo] }
  - { phase: tests, program: cargo, args: ['test|nextest|bench|miri'], tool: cargo test }
  - { phase: tests, program: dotnet, args: ['test|vstest'], tool: dotnet test }
  - { phase: tests, program: xcodebuild, with: [test], tool: xcodebuild test }
  - { phase: tests, program: xcodebuild, with: [test-without-building], tool: xcodebuild test }
  - { phase: tests, program: swift, args: [test], tool: swift test }
  - { phase: tests, program: [bazel, bazelisk], args: [test], tool: bazel test }
  - { phase: tests, program: [rspec, phpunit, pest, ctest, busted, prove] }
  - { phase: tests, program: rails, args: ['test|spec'] }
  - { phase: tests, program: rake, args: ['test|spec|test:*|spec:*'] }
  - { phase: tests, program: mix, args: ['test'] }
  - { phase: tests, program: [flutter, dart], args: ['test'] }
  - { phase: tests, program: [k6, artillery], args: ['run'] }
  # Waiting on CI: the remote run of the same checks
  - { phase: tests, program: gh, args: ['run', 'watch'], tool: ci }
  - { phase: tests, program: gh, args: ['pr', 'checks'], with: [--watch], tool: ci }

  # Build
  - { phase: build, program: [tsc, vue-tsc, tsup, unbuild, swc, babel, rollup, webpack, esbuild, parcel, rspack, rolldown, microbundle, ncc, pkg] }
  - { phase: build, program: [vite, next, nuxt, astro, remix, svelte-kit, react-router, gatsby, ng, react-scripts, vue-cli-service, electron-builder, expo], args: [build] }
  - { phase: build, program: vite, args: ['optimize'] }
  - { phase: build, program: go, args: ['build|install|generate'], tool: go build }
  - { phase: build, program: cargo, args: ['build|install|doc'], tool: cargo build }
  - { phase: build, program: dotnet, args: ['build|publish|pack|msbuild'], tool: dotnet build }
  - { phase: build, program: [msbuild, xbuild] }
  - { phase: build, program: xcodebuild, without: [-list, -showsdks, -version, -showBuildSettings], tool: xcodebuild build }
  - { phase: exploring, program: xcodebuild }
  - { phase: build, program: swift, args: ['build'], tool: swift build }
  - { phase: build, program: [bazel, bazelisk, buck, buck2, pants], args: ['build'], tool: bazel build }
  - { phase: build, program: [cmake, ninja, meson, scons, xmake, premake5, autoreconf, configure] }
  - { phase: build, program: [docker, podman], args: ['build'], tool: docker build }
  - { phase: build, program: [docker, podman], args: ['buildx|compose|image', 'build'], tool: docker build }
  - { phase: build, program: [protoc, flatc, thrift, graphql-codegen, openapi-generator, openapi-generator-cli, sqlc, wire, mockgen, stringer] }
  - { phase: build, program: buf, args: ['generate'] }
  - { phase: build, program: prisma, args: ['generate'] }
  - { phase: build, program: flutter, args: ['build|pub'] }
  - { phase: build, program: mix, args: ['compile|deps.get|release'] }
  - { phase: build, program: [pod, carthage], args: ['install|update|bootstrap'], tag: install }
  - { phase: build, program: [tuist, xcodegen], args: ['generate|install|fetch|build'] }
  - { phase: build, program: deno, args: ['compile'] }
  - { phase: build, program: bun, args: ['build'] }

  # Installing dependencies counts as Build, tagged install
  - { phase: build, program: [npm, pnpm, bun], args: ['install|i|ci|add|remove|rm|uninstall|update|up|upgrade|link|rebuild|prune|dedupe'], tag: install, tool: install }
  - { phase: build, program: yarn, only: [], tag: install, tool: install }
  - { phase: build, program: yarn, args: ['install|add|remove|upgrade|up|dedupe'], tag: install, tool: install }
  - { phase: build, program: [pip, pip3, pipx, uv, poetry, pipenv, pdm, conda, mamba, micromamba], args: ['install|sync|add|lock|update|uninstall|remove|venv|create'], tag: install, tool: install }
  - { phase: build, program: uv, args: ['pip', 'install|sync|compile'], tag: install, tool: install }
  - { phase: build, program: [bundle, gem, composer], args: ['install|update|add|require'], tag: install, tool: install }
  - { phase: build, program: go, args: ['mod|get'], tag: install, tool: install }
  - { phase: build, program: cargo, args: ['fetch|update|add|vendor'], tag: install, tool: install }
  - { phase: build, program: dotnet, args: ['restore|add|tool'], tag: install, tool: install }
  - { phase: build, program: [brew, apt, apt-get, dnf, yum, apk, port], args: ['install|upgrade|reinstall'], tag: install, tool: install }
  - { phase: build, program: playwright, args: ['install'], tag: install, tool: install }
  - { phase: build, program: [docker, podman], args: ['pull'], tag: install, tool: install }
  - { phase: build, program: [rustup, nvm, fnm, volta, pyenv, rbenv, asdf, mise, sdk], args: ['install|add|use|toolchain|target|component'], tag: install, tool: install }

  # Shell commands that only read
  - phase: exploring
    program: [ls, ll, la, lsd, eza, exa, tree, cat, bat, batcat, head, tail, less, more, grep, egrep, fgrep, rg, ag, ack, find, fd, fzf, wc, file, stat, du, df, which, whereis, type, pwd, realpath, readlink, basename, dirname, diff, colordiff, cmp, comm, jq, yq, gron, sort, uniq, cut, column, strings, xxd, hexdump, od, nl, tac, md5, md5sum, shasum, sha1sum, sha256sum, cksum, lsof, ps, pgrep, env, printenv, uname, sw_vers, whoami, id, hostname, date, man, tldr, history, tokei, cloc, scc, ldd, otool, nm, objdump, plutil, defaults, mdfind, xmllint, pdftotext, identify, exiftool, codesign, security, ioreg, system_profiler, vm_stat, sysctl, netstat, ifconfig, lsblk, free, top, htop, uptime, w, last, journalctl, dmesg, tput]
  - { phase: exploring, program: [tr, base64, fold, paste, rev, iconv, expand, unexpand, fmt, seq, tsort, numfmt, look, uuidgen] }
  - { phase: exploring, program: command, with: [-v] }
  - { phase: exploring, program: [make, gmake], with: [-n] }
  - { phase: exploring, match: '^(gcloud|aws|az|doctl|flyctl|heroku|vercel|netlify)\\s(\\S+\\s)*(list|describe|read|get|show|status|logs|print-access-token|print-identity-token|info|get-[a-z-]+|describe-[a-z-]+|list-[a-z-]+)(\\s|$)' }
  - { phase: writing, match: '^(sed|gsed)(\\s.*)?\\s(-i\\S*|--in-place\\S*)(\\s|$)' }
  - { phase: writing, match: '^perl(\\s.*)?\\s-[a-zA-Z]*i' }
  - { phase: exploring, program: [sed, gsed, awk, gawk, nawk, mawk, perl] }
  - phase: exploring
    program: git
    args: ['status|log|diff|show|blame|annotate|rev-parse|ls-files|ls-tree|ls-remote|grep|describe|shortlog|reflog|cat-file|whatchanged|range-diff|merge-base|name-rev|rev-list|count-objects|check-ignore|show-ref|for-each-ref|var|help|version|fetch']
  - { phase: exploring, program: git, args: ['stash|worktree|submodule|notes', 'list|show|status'] }
  - { phase: exploring, program: git, args: ['config'], with: [--get] }
  - { phase: exploring, program: git, args: ['config'], with: [--list] }
  - { phase: exploring, program: git, args: ['tag'], with: [-l] }
  - { phase: exploring, match: '^git (branch|tag|remote)( -[a-zA-Z-]+)*$' }
  - { phase: exploring, program: gh, args: ['pr|issue|run|repo|release|workflow|search|api|gist|label|cache', 'view|list|diff|checks|status|watch|search|download'] }
  - { phase: exploring, program: gh, args: ['api'] }
  - { phase: exploring, program: gh, args: ['auth', 'status|token'] }
  - { phase: exploring, program: [npm, pnpm, yarn, bun], args: ['ls|list|why|view|info|show|outdated|audit|explain|query|search|config|bin|root|prefix|pkg|licenses|doctor'] }
  - { phase: exploring, program: [pip, pip3, uv, poetry, conda], args: ['list|show|freeze|check|tree|info|search|env'] }
  - { phase: exploring, program: go, args: ['list|env|doc|version|tool'] }
  - { phase: exploring, program: cargo, args: ['tree|metadata|search|locate-project|pkgid|info'] }
  - { phase: exploring, program: [docker, podman], args: ['ps|images|logs|inspect|stats|top|port|history|version|info|context'] }
  - { phase: exploring, program: [docker, podman], args: ['compose', 'ps|logs|config|images|ls'] }
  - { phase: exploring, program: kubectl, args: ['get|describe|logs|top|explain|version|api-resources|config|auth|events'] }
  - { phase: exploring, program: xcrun, args: ['simctl', 'list'] }
  - { phase: exploring, program: [terraform, tofu], args: ['show|output|state|providers|version|graph'] }
  - { phase: exploring, program: coverage, args: ['report|html|xml|json'] }
  - { phase: exploring, match: '^tar\\s+-?[a-zA-Z]*t' }

  # Shell commands that change files
  - { phase: writing, program: [mkdir, touch, cp, mv, rm, rmdir, ln, chmod, chown, chgrp, truncate, tee, patch, install, rsync, unzip, ditto] }
  - { phase: writing, program: tar }
  - phase: writing
    program: git
    args: ['add|commit|checkout|switch|restore|reset|stash|merge|rebase|cherry-pick|revert|mv|rm|tag|apply|am|init|clean|branch|worktree|submodule|notes|config|remote']
    tool: git

  # Changes nothing on its own, or takes no time worth a phase
  - phase: neutral
    program: [cd, pushd, popd, echo, printf, export, unset, set, source, '.', 'true', 'false', ':', sleep, wait, exit, return, read, alias, unalias, trap, shift, local, declare, typeset, readonly, ulimit, umask, '[', '[[', test, clear, reset, hash, shopt, setopt, bindkey, eval, let, break, continue, osascript, say, afplay, notify-send, terminal-notifier, kill, pkill, killall, disown, jobs, fg, bg]

# Gradle tasks, Maven goals, and task names given to turbo, nx, sbt and similar runners.
# Tested against each task name, and against its last part for qualified names like :app:testDebug.
tasks:
  - { phase: exploring, match: '^(tasks|help|dependencies|dependencyInsight|properties|projects|buildEnvironment|outgoingVariants|resolvableConfigurations|javaToolchains|model|dependency:tree|dependency:list|help:effective-pom|versions:display-dependency-updates)$' }
  - { phase: lint, match: '^(lint[A-Za-z]*|ktlint[A-Za-z]*|detekt[A-Za-z]*|spotless[A-Za-z]*|spotless:(check|apply)|checkstyle[A-Za-z]*|checkstyle:check|pmd[A-Za-z]*|pmd:check|spotbugs[A-Za-z]*|spotbugs:check|ktfmt[A-Za-z]*|format[A-Za-z]*|typecheck|type-check|tsc|check-types|checkTypes|prettier|eslint|fmt)$' }
  - { phase: build, match: '^(build[A-Za-z]*|assemble[A-Za-z]*|bundle[A-Za-z]*|compile[A-Za-z]*|jar|bootJar|shadowJar|war|ear|dist[A-Za-z]*|install[A-Za-z]*|publish[A-Za-z]*|package|deploy|generate[A-Za-z]*|kapt[A-Za-z]*|ksp[A-Za-z]*|nativeCompile|clean|prepare|test-compile|process-resources|codegen)$' }
  - { phase: tests, match: '^(test|tests|check|verify|connectedCheck|integration-test|e2e|spec|coverage|test[A-Z][A-Za-z]*|test:.*|[a-z][A-Za-z]*Test|[a-z][A-Za-z]*Tests|connected[A-Za-z]*Test|jacoco[A-Za-z]*|kover[A-Za-z]*|surefire:test|failsafe:integration-test|failsafe:verify)$' }

# Names of npm/pnpm/yarn/bun scripts and make targets, used only when the file that defines them
# can't be read. Steps decided this way are tagged by-name.
scripts:
  - { phase: lint, match: '^(lint|lint:.*|.*:lint|format|format:.*|fmt|prettier|eslint|typecheck|type-check|types|tsc|check-types|check:types|stylelint|biome)$' }
  - { phase: tests, match: '^(test|tests|test:.*|.*:test|spec|e2e|e2e:.*|unit|integration|coverage|cy:run|vitest|jest)$' }
  - { phase: build, match: '^(build|build:.*|.*:build|compile|bundle|dist|prepare|prepack|package|generate|codegen|install|deps|all)$' }

# Tool calls other than Bash, by name: exact names, or a regex in match.
tools:
  - { phase: exploring, name: [Read, Grep, Glob, LS, WebSearch, WebFetch, NotebookRead, LSP, ToolSearch, Skill, ListMcpResourcesTool, ReadMcpResourceTool, ListAgents] }
  - { phase: writing, name: [Edit, Write, MultiEdit, NotebookEdit] }
  - { phase: planning, name: [TodoWrite, TodoRead, TaskCreate, TaskUpdate, TaskList, TaskGet, EnterPlanMode, ExitPlanMode, StructuredOutput, SubagentHandback, SendMessage, SendUserMessage, SendUserFile, Workflow] }
  - { phase: planning, match: '^mcp__ccd_turn__' }
  - { phase: waiting, name: [AskUserQuestion] }
  - { phase: lint, name: [mcp__ide__getDiagnostics] }

# Files whose edits count as Writing tests rather than Writing code.
testFiles:
  - '**/*_test.go'
  - '**/*.{test,spec}.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'
  - '**/*.{test,spec}-d.ts'
  - '**/__tests__/**'
  - '**/__mocks__/**'
  - '**/test_*.py'
  - '**/*_test.py'
  - '**/conftest.py'
  - '**/src/test/**'
  - '**/src/androidTest/**'
  - '**/src/*Test/**'
  - '**/*{Test,Tests,IT,Spec}.{java,kt,scala,groovy}'
  - '**/Tests/**'
  - '**/*Tests/**'
  - '**/*{Test,Tests}.swift'
  - '**/*.Tests/**'
  - '**/*.UnitTests/**'
  - '**/*{Test,Tests}.cs'
  - '**/*_spec.rb'
  - '**/*_test.rb'
  - '**/test/**'
  - '**/tests/**'
  - '**/spec/**'
  - '**/e2e/**'
  - '**/*_test.{c,cc,cpp,rs,exs,dart}'
  - '**/*.test.{c,cc,cpp}'

# Failure patterns, matched against a check's output when the transcript has it, to catch failures
# a pipe hid (pnpm test | tail). tool names a check (program or rule tool); * applies to every check.
failurePatterns:
  - { tool: vitest, pattern: '(Test Files|Tests)\\s+(\\d+ failed|.*\\b\\d+ failed)' }
  - { tool: jest, pattern: 'Tests:\\s+\\d+ failed' }
  - { tool: mocha, pattern: '\\b\\d+ failing\\b' }
  - { tool: node, pattern: '(?m)^# fail [1-9]' }
  - { tool: pytest, pattern: '(?m)^(=+ .*\\b\\d+ (failed|error)|FAILED |ERROR )' }
  - { tool: go test, pattern: '(?m)^(FAIL|--- FAIL)\\b' }
  - { tool: cargo test, pattern: 'test result: FAILED' }
  - { tool: cargo build, pattern: 'error(\\[E\\d{4}\\])?: ' }
  - { tool: cargo clippy, pattern: '(?m)^error(\\[|:)' }
  - { tool: tsc, pattern: 'error TS\\d+' }
  - { tool: tsc --noEmit, pattern: 'error TS\\d+' }
  - { tool: eslint, pattern: '\\d+ problems? \\(\\d+ errors?' }
  - { tool: prettier, pattern: 'Code style issues found|\\[error\\]' }
  - { tool: ruff, pattern: 'Found \\d+ errors?|Would reformat' }
  - { tool: mypy, pattern: 'Found \\d+ errors?' }
  - { tool: gradle, pattern: 'BUILD FAILED|FAILURE: Build failed' }
  - { tool: mvn, pattern: 'BUILD FAILURE' }
  - { tool: xcodebuild test, pattern: '\\*\\* TEST FAILED \\*\\*|Testing failed' }
  - { tool: xcodebuild build, pattern: '\\*\\* BUILD FAILED \\*\\*' }
  - { tool: dotnet build, pattern: 'Build FAILED|error [A-Z]{2,}\\d+' }
  - { tool: dotnet test, pattern: 'Failed!\\s+-\\s+Failed:\\s+[1-9]' }
  - { tool: swift test, pattern: 'error: |Test Suite .* failed' }
  - { tool: ci, pattern: 'completed with .failure.|X .* failed|run failed' }
  - { tool: '*', pattern: 'ELIFECYCLE\\s+(Command|Test) failed|npm ERR! (code|Test failed)|\\bFAILED\\b|BUILD FAILED|error\\[' }
`;

// src/classify/rules.ts
var RULE_PHASES = /* @__PURE__ */ new Set([
  "lint",
  "tests",
  "build",
  "exploring",
  "writing",
  "planning",
  "waiting",
  "neutral"
]);
function regex(source, where) {
  let flags = "";
  let body = source;
  const inline = /^\(\?([mis]+)\)/.exec(body);
  if (inline) {
    flags = inline[1];
    body = body.slice(inline[0].length);
  }
  try {
    return new RegExp(body, flags);
  } catch (error) {
    throw new Error(`${where}: bad regex ${JSON.stringify(source)}: ${error.message}`, {
      cause: error
    });
  }
}
function list(value) {
  if (value === void 0 || value === null) return [];
  return (Array.isArray(value) ? value : [value]).map(String);
}
function phaseOf(value, where) {
  if (typeof value === "string" && RULE_PHASES.has(value)) return value;
  throw new Error(
    `${where}: unknown phase ${JSON.stringify(value)}; use one of ${[...RULE_PHASES].join(", ")}`
  );
}
function parseDoc(text, source) {
  const doc = import_yaml2.default.parse(text) ?? {};
  if (typeof doc !== "object" || Array.isArray(doc))
    throw new Error(`${source}: expected a YAML mapping`);
  return doc;
}
function entries(doc, key, source) {
  const value = doc[key];
  if (value === void 0 || value === null) return [];
  if (!Array.isArray(value)) throw new Error(`${source}: "${key}" must be a list`);
  return value;
}
function compileRules(docs) {
  const rules = {
    commands: [],
    tasks: [],
    scripts: [],
    tools: [],
    testFiles: [],
    failurePatterns: [],
    sources: []
  };
  for (const { text, source } of docs) {
    const doc = parseDoc(text, source);
    rules.sources.push(source);
    entries(doc, "commands", source).forEach((r, i) => {
      const where = `${source} commands[${i}]`;
      const rule = {
        id: `${path2.basename(source)}:commands[${i}]`,
        phase: phaseOf(r.phase, where)
      };
      if (r.program !== void 0) rule.programs = new Set(list(r.program));
      if (r.args !== void 0) rule.args = list(r.args).map((a) => a.split("|"));
      if (r.with !== void 0) rule.with = list(r.with);
      if (r.without !== void 0) rule.without = list(r.without);
      if (r.only !== void 0) rule.only = new Set(list(r.only));
      if (r.match !== void 0) rule.match = regex(String(r.match), where);
      if (r.tag !== void 0) rule.tag = String(r.tag);
      if (r.tool !== void 0) rule.tool = String(r.tool);
      if (!rule.programs && !rule.match) throw new Error(`${where}: needs program or match`);
      rules.commands.push(rule);
    });
    for (const key of ["tasks", "scripts"]) {
      entries(doc, key, source).forEach((r, i) => {
        const where = `${source} ${key}[${i}]`;
        if (r.match === void 0) throw new Error(`${where}: needs match`);
        rules[key].push({
          id: `${path2.basename(source)}:${key}[${i}]`,
          phase: phaseOf(r.phase, where),
          match: regex(String(r.match), where)
        });
      });
    }
    entries(doc, "tools", source).forEach((r, i) => {
      const where = `${source} tools[${i}]`;
      const rule = {
        id: `${path2.basename(source)}:tools[${i}]`,
        phase: phaseOf(r.phase, where)
      };
      if (r.name !== void 0) rule.names = new Set(list(r.name));
      if (r.match !== void 0) rule.match = regex(String(r.match), where);
      if (!rule.names && !rule.match) throw new Error(`${where}: needs name or match`);
      rules.tools.push(rule);
    });
    for (const glob of list(doc.testFiles)) rules.testFiles.push(globToRegExp(glob));
    entries(doc, "failurePatterns", source).forEach((r, i) => {
      const where = `${source} failurePatterns[${i}]`;
      rules.failurePatterns.push({
        tool: String(r.tool ?? "*"),
        pattern: regex(String(r.pattern), where)
      });
    });
  }
  return rules;
}
var DEFAULT_RULES_SOURCE = "default-rules.yaml";
var defaults;
function defaultRules() {
  defaults ??= compileRules([{ text: default_rules_default, source: DEFAULT_RULES_SOURCE }]);
  return defaults;
}
function loadRules(cwd, files) {
  if (!cwd) return defaultRules();
  let dir = path2.resolve(cwd);
  for (let i = 0; i < 12; i++) {
    const file = path2.join(dir, ".awf", "rules.yaml");
    const text = files.read(file);
    if (text !== void 0) {
      return compileRules([
        { text, source: file },
        { text: default_rules_default, source: DEFAULT_RULES_SOURCE }
      ]);
    }
    const parent = path2.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return defaultRules();
}

// src/classify/classify.ts
var MAX_DEPTH = 4;
var COMPOUND_RANK = {
  build: 10,
  tests: 9,
  lint: 8,
  unclassified: 7,
  rework: 6,
  "writing-tests": 5,
  "writing-code": 4,
  exploring: 3,
  planning: 2,
  waiting: 1
};
function sleepSeconds(arg) {
  const match = /^(\d+(?:\.\d+)?)([smhd]?)$/.exec(arg ?? "");
  if (!match) return 0;
  const unit = { "": 1, s: 1, m: 60, h: 3600, d: 86400 };
  return Number(match[1]) * (unit[match[2] ?? ""] ?? 1);
}
var BACKGROUND_TOOLS = /* @__PURE__ */ new Set(["TaskOutput", "BashOutput", "KillShell", "KillBash", "TaskStop"]);
var WRITERS = /* @__PURE__ */ new Set([
  "mkdir",
  "touch",
  "cp",
  "mv",
  "rm",
  "rmdir",
  "ln",
  "tee",
  "truncate",
  "install",
  "rsync",
  "patch",
  "sed",
  "gsed",
  "perl",
  "ditto",
  "unzip"
]);
var Classifier = class {
  constructor(rules, files) {
    this.rules = rules;
    this.files = files;
  }
  rules;
  files;
  /** Classifies one Bash command run in `cwd`. */
  command(text, cwd) {
    return this.combine(this.parts(text, cwd, 0), cwd);
  }
  isTestFile(file) {
    return matchesAny(file, this.rules.testFiles);
  }
  parts(text, cwd, depth) {
    const parts = [];
    const simples = splitCommand(text);
    for (const simple of simples) {
      if (simple.argv[0] === "cd") continue;
      const where = simple.cd.reduce((dir, target) => resolvePath(dir, target), cwd);
      parts.push(...this.simple(simple, where, depth));
    }
    const sleeps = simples.map((s) => unwrap(s.argv).argv).filter((a) => programName(a[0] ?? "") === "sleep");
    const loop = /(^|[\s;&|])(while|until|for)\s[\s\S]*(^|[\s;])do(\s|$)/m.test(
      stripHeredocs(text)
    );
    if (sleeps.length > 0 && (loop || sleeps.some((a) => sleepSeconds(a[1]) >= 5))) {
      for (const part of parts) part.polling = true;
    }
    return parts;
  }
  simple(simple, cwd, depth) {
    const argv = withoutGlobalOptions(unwrap(simple.argv).argv);
    const program = programName(argv[0] ?? "");
    const out = [];
    if (simple.writes.length > 0) {
      out.push({
        phase: "writing",
        program,
        tags: [],
        checks: [],
        rule: "redirect",
        files: simple.writes,
        piped: simple.piped
      });
    }
    const inner = shellString(argv);
    if (inner !== void 0 && depth < MAX_DEPTH) {
      return [
        ...out,
        ...this.parts(inner, cwd, depth + 1).map((p) => ({ ...p, piped: p.piped || simple.piped }))
      ];
    }
    if (depth < MAX_DEPTH) {
      const resolved = this.resolved(argv, cwd, depth, simple.piped);
      if (resolved) return [...out, ...resolved];
    }
    out.push(this.byRule(argv, program, simple.piped, []));
    return out;
  }
  /** Scripts, make targets, task runners, hooks and script files, classified by what they run. */
  resolved(argv, cwd, depth, piped) {
    const res = resolve(argv, cwd, this.files);
    if (!res) return void 0;
    const program = programName(argv[0] ?? "");
    const tagged = (parts, tag) => parts.map((p) => ({ ...p, piped: p.piped || piped, tags: unique([...p.tags, tag]) }));
    switch (res.kind) {
      case "script": {
        const parts = res.commands.flatMap((c) => this.parts(c, res.cwd, depth + 1));
        return tagged(
          parts.length > 0 ? parts : [this.unmatched(program, piped)],
          `script:${res.name}`
        );
      }
      case "make": {
        const parts = res.commands.flatMap((c) => this.parts(c, res.cwd, depth + 1));
        return tagged(
          parts.length > 0 ? parts : [this.unmatched(program, piped)],
          `make:${res.target}`
        );
      }
      case "hook":
      case "file": {
        const parts = res.commands.flatMap((c) => this.parts(c, res.cwd, depth + 1));
        const tag = res.kind === "hook" ? `hook:${res.name}` : `file:${res.file}`;
        return tagged(parts.length > 0 ? parts : [this.unmatched(program, piped)], tag);
      }
      case "bin": {
        const parts = this.simple({ argv: res.argv, writes: [], cd: [], piped }, cwd, depth + 1);
        return tagged(parts, `via:${program}`);
      }
      case "script-name": {
        const rule = this.rules.scripts.find((r) => r.match.test(res.name));
        if (rule)
          return [
            this.part(
              rule.phase,
              res.name,
              rule.id,
              piped,
              ["by-name", `script:${res.name}`],
              `${res.runner} ${res.name}`
            )
          ];
        return tagged(
          this.simple({ argv: [res.name, ...res.rest], writes: [], cd: [], piped }, cwd, depth + 1),
          `script:${res.name}`
        );
      }
      case "make-name": {
        if (!res.target)
          return [this.part("build", "make", "make:default", piped, ["by-default"], "make")];
        const rule = this.rules.scripts.find((r) => r.match.test(res.target));
        if (rule)
          return [
            this.part(
              rule.phase,
              "make",
              rule.id,
              piped,
              ["by-name", `make:${res.target}`],
              `make ${res.target}`
            )
          ];
        return [{ ...this.unmatched("make", piped), tags: [`make:${res.target}`] }];
      }
      case "tasks": {
        return res.tasks.map((task) => {
          const last = task.split(":").pop() ?? task;
          const rule = this.rules.tasks.find((r) => r.match.test(task) || r.match.test(last));
          if (!rule) return { ...this.unmatched(res.runner, piped), tags: [`task:${task}`] };
          return this.part(rule.phase, res.runner, rule.id, piped, [`task:${task}`], res.runner);
        });
      }
    }
  }
  part(phase, program, rule, piped, tags, tool) {
    const checks = isCheckPhase(phase) ? [{ key: `${phase}:${tool}`, phase, tool, failed: false }] : [];
    return { phase, program, tags, checks, rule, files: [], piped };
  }
  unmatched(program, piped) {
    return { phase: void 0, program, tags: [], checks: [], rule: "none", files: [], piped };
  }
  byRule(argv, program, piped, tags) {
    const rule = this.rules.commands.find((r) => ruleMatches(r, program, argv));
    if (!rule) return { ...this.unmatched(program, piped), tags };
    const part = this.part(
      rule.phase,
      program,
      rule.id,
      piped,
      rule.tag ? [rule.tag, ...tags] : tags,
      rule.tool ?? program
    );
    if (rule.phase === "writing" && WRITERS.has(program)) {
      part.files = argv.slice(1).filter((a) => !a.startsWith("-") && /[/.]/.test(a));
    }
    return part;
  }
  /**
   * Rule 2: a compound command takes its highest-ranked phase; the rest become tags. A part no rule
   * matches ranks above Writing and Exploring: those commands take next to no time, so the unknown
   * part most likely took it. Waiting in a loop or a long sleep, with no check, is polling.
   */
  combine(parts, cwd) {
    const counted = parts.filter(
      (p) => p.phase !== "neutral" && (!p.piped || isCheckPhase(p.phase) || p.phase === "writing")
    );
    const resolvedPhase = (p) => {
      if (p.phase === void 0) return "unclassified";
      if (p.phase === "writing") {
        return p.files.some((f) => this.isTestFile(path3.isAbsolute(f) ? f : path3.join(cwd, f))) ? "writing-tests" : "writing-code";
      }
      return p.phase;
    };
    const phases = counted.map(resolvedPhase);
    const hasCheck = phases.some((p) => isCheckPhase(p));
    const polling = !hasCheck && parts.some((p) => p.polling);
    let primary = polling ? "unclassified" : void 0;
    if (!primary) {
      for (const phase of phases) {
        if (!primary || COMPOUND_RANK[phase] > COMPOUND_RANK[primary]) primary = phase;
      }
    }
    const tags = /* @__PURE__ */ new Set();
    for (const part of parts) for (const tag of part.tags) tags.add(tag);
    for (const phase of phases) if (phase !== primary && phase !== "unclassified") tags.add(phase);
    for (const part of parts) if (!part.phase) tags.add(`unmatched:${part.program}`);
    if (polling) tags.add("polling");
    const checks = /* @__PURE__ */ new Map();
    for (const part of parts)
      for (const check of part.checks)
        if (!checks.has(check.key)) checks.set(check.key, { ...check });
    if (!primary || primary === "unclassified") {
      const onlyNeutral = parts.length > 0 && parts.every((p) => p.phase === "neutral" || p.piped && p.phase);
      if (onlyNeutral && !polling) tags.add("neutral");
      const rule = onlyNeutral ? parts.find((p) => p.phase === "neutral")?.rule ?? "none" : "none";
      return { phase: "unclassified", tags: [...tags], checks: [...checks.values()], rule };
    }
    const decider = counted[phases.indexOf(primary)];
    return {
      phase: primary,
      tags: [...tags],
      checks: [...checks.values()],
      rule: decider?.rule ?? "none"
    };
  }
  /** Classifies a whole session: every step gets a phase (containers excepted), checks and failures. */
  session(session) {
    const steps = session.steps.map((s) => ({
      ...s,
      tags: [],
      checks: [],
      failed: false
    }));
    const byId = new Map(steps.map((s) => [s.id, s]));
    const hasChildren = new Set(steps.map((s) => s.parentId).filter((id) => !!id));
    const home = session.cwd ?? process.cwd();
    const shellCwd = /* @__PURE__ */ new Map();
    const ordered = steps.filter((s) => s.kind === "tool" || s.kind === "background").sort((a, b) => a.startMs - b.startMs);
    for (const step of ordered) {
      if (step.kind === "background" || isShellTool(step.tool)) {
        const ctx = step.agentId ?? "";
        const cwd = shellCwd.get(ctx) ?? home;
        if (!step.command) {
          step.phase = "unclassified";
          step.tags = ["no-command"];
          continue;
        }
        const info = this.command(step.command, cwd);
        Object.assign(step, {
          phase: info.phase,
          tags: info.tags,
          checks: info.checks,
          rule: info.rule
        });
        if (step.kind === "tool") shellCwd.set(ctx, nextCwd(step.command, cwd, home));
        this.markFailures(step);
      } else {
        this.tool(step, hasChildren);
      }
    }
    for (const step of ordered) {
      if (step.kind !== "tool" || !step.tool || !BACKGROUND_TOOLS.has(step.tool)) continue;
      const source = steps.find(
        (s) => s !== step && s.backgroundId && s.backgroundId === step.backgroundId && s.phase && s.phase !== "unclassified"
      );
      if (source?.phase) {
        step.phase = source.phase;
        step.tags = unique([...step.tags, "background-task"]);
      }
    }
    for (const step of steps) {
      if (step.kind === "model") step.phase = this.modelPhase(step, byId);
      else if (step.kind === "idle") step.phase = "waiting";
      else if (step.kind === "compact") {
        step.phase = "unclassified";
        step.tags = ["compaction"];
      }
    }
    return { ...session, steps };
  }
  tool(step, hasChildren) {
    const name = step.tool ?? "";
    if (AGENT_TOOLS.has(name)) {
      if (!hasChildren.has(step.id)) {
        step.phase = "unclassified";
        step.tags = ["subagent"];
      }
      return;
    }
    if (BACKGROUND_TOOLS.has(name)) {
      step.phase = "unclassified";
      step.tags = ["background-task"];
      return;
    }
    const rule = this.rules.tools.find((r) => r.names?.has(name) || r.match?.test(name));
    if (!rule || rule.phase === "neutral") {
      step.phase = "unclassified";
      return;
    }
    step.rule = rule.id;
    if (rule.phase === "writing") {
      step.phase = (step.files ?? []).some((f) => this.isTestFile(f)) ? "writing-tests" : "writing-code";
    } else {
      step.phase = rule.phase;
      if (isCheckPhase(rule.phase)) {
        step.checks = [
          { key: `${rule.phase}:${name}`, phase: rule.phase, tool: name, failed: false }
        ];
        this.markFailures(step);
      }
    }
  }
  /** Rule 4: exit code or failure event, else output patterns; a tool's own pattern names the check. */
  markFailures(step) {
    if (step.checks.length === 0) return;
    const stopped = step.flags.includes("interrupted") || step.flags.includes("denied");
    const output = step.detail?.output;
    const byTool = (tool) => this.rules.failurePatterns.filter((p) => p.tool === tool);
    const named = output ? step.checks.filter((c) => byTool(c.tool).some((p) => p.pattern.test(output))) : [];
    const generic = output ? byTool("*").some((p) => p.pattern.test(output)) : false;
    if (named.length > 0) {
      for (const check of named) check.failed = true;
    } else if (step.ok === false && !stopped || generic) {
      const top = [...step.checks].sort((a, b) => RANK[b.phase] - RANK[a.phase])[0];
      top.failed = true;
      if (step.checks.length > 1) step.tags = unique([...step.tags, "failure-unattributed"]);
    }
    step.failed = step.checks.some((c) => c.failed);
  }
  /** Rule 1: model time takes the phase of the call it produced. */
  modelPhase(step, byId) {
    const phases = [];
    for (const id of step.produces ?? []) {
      const produced = byId.get(id);
      if (!produced) continue;
      if (produced.tool && AGENT_TOOLS.has(produced.tool)) phases.push("planning");
      else if (produced.phase === "waiting") phases.push("planning");
      else if (produced.phase) phases.push(produced.phase);
    }
    return topPhase(phases) ?? "planning";
  }
};
function withoutGlobalOptions(argv) {
  if (programName(argv[0] ?? "") !== "git") return argv;
  const out = [argv[0]];
  let i = 1;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === "-C" || arg === "-c" || arg === "--git-dir" || arg === "--work-tree" || arg === "--namespace")
      i += 2;
    else if (arg.startsWith("--git-dir=") || arg.startsWith("--work-tree=") || arg === "--no-pager" || arg === "-P" || arg === "--paginate" || arg === "--bare" || arg === "--no-optional-locks")
      i++;
    else break;
  }
  return [...out, ...argv.slice(i)];
}
function isShellTool(tool) {
  return tool === "Bash" || tool === "PowerShell" || tool === "shell" || tool === "run_shell_command";
}
function nextCwd(command, cwd, home) {
  let dir = cwd;
  for (const simple of splitCommand(command)) {
    if (simple.argv[0] === "cd" && !simple.piped)
      dir = resolvePath(
        simple.cd.reduce((d, t) => resolvePath(d, t), cwd),
        simple.argv[1] ?? "~"
      );
  }
  return dir === home || dir.startsWith(home + path3.sep) ? dir : home;
}
function ruleMatches(rule, program, argv) {
  if (rule.programs && !rule.programs.has(program)) return false;
  const args = argv.slice(1);
  if (rule.match && !rule.match.test(argv.join(" "))) return false;
  if (rule.args) {
    const positional = args.filter((a) => !a.startsWith("-") && !a.startsWith("+"));
    let at = 0;
    for (let i = 0; i < rule.args.length; i++) {
      const options = rule.args[i];
      const fits = (word) => word !== void 0 && options.some((o) => o.endsWith("*") ? word.startsWith(o.slice(0, -1)) : o === word);
      if (i === 0) {
        if (!fits(positional[0])) return false;
        at = 1;
        continue;
      }
      const found = positional.slice(at, at + 3).findIndex(fits);
      if (found < 0) return false;
      at += found + 1;
    }
  }
  const has = (flag) => args.some((a) => a === flag || a.startsWith(flag + "="));
  if (rule.with && !rule.with.every(has)) return false;
  if (rule.without && rule.without.some(has)) return false;
  if (rule.only && !args.every((a) => rule.only?.has(a))) return false;
  return true;
}
function unique(items) {
  return [...new Set(items)];
}

// src/store/events.ts
import { existsSync as existsSync2, readdirSync, readFileSync as readFileSync2, statSync as statSync2 } from "node:fs";
import path5 from "node:path";

// src/store/paths.ts
import os2 from "node:os";
import path4 from "node:path";
function awfHome(env = process.env) {
  return env.AWF_HOME || path4.join(os2.homedir(), ".awf");
}
function eventsDir(env = process.env) {
  return path4.join(awfHome(env), "events");
}
function importedDir(env = process.env) {
  return path4.join(awfHome(env), "imported");
}
function claudeProjectsDir(env = process.env) {
  if (env.AWF_CLAUDE_PROJECTS) return env.AWF_CLAUDE_PROJECTS;
  return path4.join(env.CLAUDE_CONFIG_DIR || path4.join(os2.homedir(), ".claude"), "projects");
}
function safeId(id) {
  return id.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 128);
}

// src/store/events.ts
function listEventFiles(env = process.env) {
  const dir = eventsDir(env);
  if (!existsSync2(dir)) return [];
  return readdirSync(dir).filter((name) => name.endsWith(".jsonl")).map((name) => {
    const file = path5.join(dir, name);
    const stat = statSync2(file);
    return {
      id: name.slice(0, -".jsonl".length),
      path: file,
      mtimeMs: stat.mtimeMs,
      size: stat.size
    };
  });
}
function readEvents(file) {
  const events = [];
  for (const line of readFileSync2(file, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      if (event && typeof event.e === "string" && typeof event.t === "number") events.push(event);
    } catch {
    }
  }
  return events;
}

// src/store/imported.ts
import {
  existsSync as existsSync3,
  mkdirSync,
  readdirSync as readdirSync2,
  readFileSync as readFileSync3,
  renameSync,
  writeFileSync
} from "node:fs";
import path6 from "node:path";
function cacheFile(id, env = process.env) {
  return path6.join(importedDir(env), `${safeId(id)}.json`);
}
function readImported(id, env = process.env) {
  const file = cacheFile(id, env);
  if (!existsSync3(file)) return void 0;
  try {
    const parsed = JSON.parse(readFileSync3(file, "utf8"));
    return parsed.version === 1 && parsed.session ? parsed : void 0;
  } catch {
    return void 0;
  }
}
function writeImported(entry, env = process.env) {
  const dir = importedDir(env);
  mkdirSync(dir, { recursive: true });
  const file = cacheFile(entry.session.id, env);
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(entry));
  renameSync(tmp, file);
}
function listImportedIds(env = process.env) {
  const dir = importedDir(env);
  if (!existsSync3(dir)) return [];
  return readdirSync2(dir).filter((name) => name.endsWith(".json")).map((name) => name.slice(0, -".json".length));
}
function stripDetail(session) {
  const { title: _title, ...rest } = session;
  return {
    ...rest,
    steps: session.steps.map((step) => {
      const { detail: _detail, ...kept } = step;
      return kept;
    })
  };
}

// src/store/sessions.ts
import { existsSync as existsSync6, statSync as statSync4 } from "node:fs";
import path9 from "node:path";

// src/importers/claude-code/import.ts
import { existsSync as existsSync4, readdirSync as readdirSync3, readFileSync as readFileSync4 } from "node:fs";
import path7 from "node:path";

// src/model/mask.ts
var MASK = "\u2039masked\u203A";
var SECRET_NAME = "[A-Za-z0-9_]*(?:TOKEN|SECRET|PASSWORD|PASSWD|PASSPHRASE|API_?KEY|ACCESS_?KEY|PRIVATE_?KEY|CLIENT_?SECRET|CREDENTIALS?|AUTH|SESSION_?KEY|COOKIE)[A-Za-z0-9_]*";
var PATTERNS = [
  // Private key blocks
  [
    /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?(?:-----END [A-Z ]*PRIVATE KEY-----|$)/g,
    `-----BEGIN PRIVATE KEY----- ${MASK} -----END PRIVATE KEY-----`
  ],
  // Authorization headers, before the generic rule so the scheme word survives
  [
    /\b(Authorization|Proxy-Authorization)(\s*:\s*)(?:(Bearer|Basic|Token|Bot)\s+)?(?!‹)[^\s"']+/gi,
    `$1$2$3 ${MASK}`
  ],
  [/\b(x-api-key|api-key|x-auth-token|x-access-token)(\s*:\s*)(?!‹)[^\s"']+/gi, `$1$2${MASK}`],
  // NAME=value and NAME: value for secret-looking names, in env assignments, exports and config lines.
  // A value that is a variable or a command substitution ($TOKEN, $(gh auth token)) holds no secret
  // in the text, and masking it would break the command.
  [
    new RegExp(
      `\\b(${SECRET_NAME})(\\s*[=:]\\s*)(?!\u2039|(?:Bearer|Basic|Token|Bot)\\s+\u2039|["']?[$\`])("[^"]*"|'[^']*'|[^\\s"';&|]+)`,
      "gi"
    ),
    `$1$2${MASK}`
  ],
  // Credentials in connection strings: scheme://user:password@host
  [/\b([a-z][a-z0-9+.-]*:\/\/[^:/\s@"']+:)([^@\s"']+)(@)/gi, `$1${MASK}$3`],
  // CLI flags that take a secret
  [
    /(--?(?:password|passwd|pass|token|api-key|apikey|secret|access-key|secret-key|auth-token|client-secret)(?:=|\s+))("[^"]*"|'[^']*'|[^\s"']+)/gi,
    `$1${MASK}`
  ],
  // Well-known token formats
  [/\bsk-ant-[A-Za-z0-9_-]{10,}/g, MASK],
  [/\bsk-(?:proj-|live-|test-)?[A-Za-z0-9_-]{20,}/g, MASK],
  [/\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{10,}/g, MASK],
  [/\bgh[pousr]_[A-Za-z0-9]{20,}/g, MASK],
  [/\bgithub_pat_[A-Za-z0-9_]{20,}/g, MASK],
  [/\bglpat-[A-Za-z0-9_-]{16,}/g, MASK],
  [/\bxox[abposr]-[A-Za-z0-9-]{10,}/g, MASK],
  [/\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g, MASK],
  [/\bAIza[0-9A-Za-z_-]{30,}/g, MASK],
  [/\bnpm_[A-Za-z0-9]{30,}/g, MASK],
  [/\bya29\.[A-Za-z0-9_-]{20,}/g, MASK],
  [/\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, MASK]
];
function maskSecrets(text) {
  let out = text;
  for (const [pattern, replacement] of PATTERNS) out = out.replace(pattern, replacement);
  return out;
}
function dropHeredocBodies(command) {
  if (!command.includes("<<")) return command;
  const lines = command.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    out.push(line);
    const tags = [...line.matchAll(/<<-?\s*(?:'([^']+)'|"([^"]+)"|\\?([A-Za-z_][A-Za-z0-9_]*))/g)].map((m) => m[1] ?? m[2] ?? m[3]).filter((tag) => Boolean(tag));
    for (const tag of tags) {
      let body = 0;
      while (i + 1 < lines.length && (lines[i + 1] ?? "").trim() !== tag) {
        i++;
        body++;
      }
      if (body > 0) out.push(`\u2039${body} line${body === 1 ? "" : "s"}\u203A`);
      if (i + 1 < lines.length) {
        i++;
        out.push(lines[i] ?? "");
      }
    }
  }
  return out.join("\n");
}
var MAX_COMMAND = 4e3;
function cleanCommand(command) {
  const cleaned = maskSecrets(dropHeredocBodies(command));
  return cleaned.length > MAX_COMMAND ? cleaned.slice(0, MAX_COMMAND) + " \u2039\u2026\u203A" : cleaned;
}

// src/importers/claude-code/format.ts
var READ_TYPES = /* @__PURE__ */ new Set(["user", "assistant", "system", "queue-operation", "attachment"]);
var SKIPPED_TYPES = /* @__PURE__ */ new Set([
  "summary",
  "last-prompt",
  "ai-title",
  "custom-title",
  "agent-name",
  "mode",
  "permission-mode",
  "atis-latch",
  "cost-state",
  "pr-link",
  "file-history-snapshot",
  "file-history-delta",
  "api-request",
  "api-request-blob",
  "api-request-shape",
  "bridge-session",
  "relocated",
  "frame-link",
  "artifact-autoreact-ledger",
  "artifact-comment-monitor",
  "tools-used",
  "fork-context-ref",
  "progress"
]);
var SYSTEM_SUBTYPES = /* @__PURE__ */ new Set([
  "turn_duration",
  "stop_hook_summary",
  "away_summary",
  "api_error",
  "compact_boundary",
  "local_command",
  "informational",
  "agents_killed",
  "bridge_status"
]);
var BLOCK_TYPES = /* @__PURE__ */ new Set([
  "text",
  "thinking",
  "redacted_thinking",
  "tool_use",
  "tool_result",
  "image",
  "document",
  "server_tool_use",
  "web_search_tool_result"
]);
function str(value) {
  return typeof value === "string" && value.length > 0 ? value : void 0;
}
function obj(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function timestampMs(entry) {
  const raw = str(entry.timestamp);
  if (!raw) return void 0;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : void 0;
}
function contentBlocks(entry) {
  const content = obj(entry.message)?.content;
  return Array.isArray(content) ? content.filter((b) => !!obj(b)) : [];
}
function messageText(entry) {
  const content = obj(entry.message)?.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((b) => obj(b)?.type === "text" ? String(obj(b)?.text ?? "") : "").filter(Boolean).join("\n");
}
function resultText(block) {
  const content = block.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((b) => obj(b)?.type === "text" ? String(obj(b)?.text ?? "") : "").filter(Boolean).join("\n");
}
function promptKind(entry) {
  if (entry.isCompactSummary === true || entry.isVisibleInTranscriptOnly === true) return "none";
  if (contentBlocks(entry).some((b) => b.type === "tool_result")) return "none";
  const text = messageText(entry).trimStart();
  if (text.startsWith("[Request interrupted")) return "none";
  const origin = str(obj(entry.origin)?.kind);
  if (origin) return origin === "human" ? "human" : "notification";
  if (entry.isMeta === true || !text) return "none";
  if (text.startsWith("<task-notification>")) return "notification";
  if (!text.startsWith("<")) return "human";
  if (text.startsWith("<command-name>") || text.startsWith("<pasted_content")) return "human";
  return "none";
}
function parseNotification(text, ms) {
  if (!text.includes("<task-notification>")) return void 0;
  const tag = (name) => new RegExp(`<${name}>([^<]*)</${name}>`).exec(text)?.[1]?.trim();
  const notice = { ms };
  const taskId = tag("task-id");
  const toolUseId = tag("tool-use-id");
  const status = tag("status");
  if (taskId) notice.taskId = taskId;
  if (toolUseId) notice.toolUseId = toolUseId;
  if (status) notice.status = status;
  return notice;
}
var EXIT_CODE = /^(?:Error: )?Exit code (\d+)/;

// src/importers/claude-code/import.ts
var FILE_KEYS = ["file_path", "notebook_path", "path"];
var MAX_OUTPUT = 4e3;
function importClaudeCodeTranscript(file, options = {}) {
  const sessionId = path7.basename(file, ".jsonl");
  const reader = new TranscriptReader(options);
  reader.readMain(readLines(file));
  const subDir = path7.join(path7.dirname(file), sessionId, "subagents");
  if (existsSync4(subDir)) {
    for (const name of readdirSync3(subDir).sort()) {
      const match = /^agent-(.+)\.jsonl$/.exec(name);
      if (match?.[1]) reader.readSubagent(match[1], readLines(path7.join(subDir, name)));
    }
  }
  return reader.build(sessionId, file);
}
function readLines(file) {
  return readFileSync4(file, "utf8").split("\n");
}
var TranscriptReader = class {
  constructor(options) {
    this.options = options;
  }
  options;
  events = [];
  diagnostics = {
    unknownEntries: {},
    badLines: 0,
    warnings: []
  };
  toolUses = /* @__PURE__ */ new Map();
  messages = /* @__PURE__ */ new Map();
  details = /* @__PURE__ */ new Map();
  startEvents = /* @__PURE__ */ new Map();
  /** Calls of each assistant message still waiting for a result, to know when its batch is done. */
  batches = /* @__PURE__ */ new Map();
  notifications = [];
  /** Subagent type per agent ID, from the Agent call that ran it. */
  agentTypes = /* @__PURE__ */ new Map();
  turnOpen = false;
  turnStart = 0;
  lastActivity = 0;
  turnEndMark;
  cwd;
  version;
  title;
  count(key) {
    this.diagnostics.unknownEntries[key] = (this.diagnostics.unknownEntries[key] ?? 0) + 1;
  }
  emit(event) {
    this.events.push({ v: 1, sid: "", ...event });
  }
  parse(lines) {
    const entries2 = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const entry = JSON.parse(line);
        if (obj(entry)) entries2.push(entry);
        else this.diagnostics.badLines++;
      } catch {
        this.diagnostics.badLines++;
      }
    }
    return entries2;
  }
  /** Checks an entry's type, notes its version and cwd; returns false for entries to skip. */
  accept(entry) {
    const type = str(entry.type) ?? "<no type>";
    const version = str(entry.version);
    if (version && (!this.version || compareVersions(version, this.version) > 0))
      this.version = version;
    if (!this.cwd && str(entry.cwd)) this.cwd = str(entry.cwd);
    if (SKIPPED_TYPES.has(type)) return false;
    if (!READ_TYPES.has(type)) {
      this.count(type);
      return false;
    }
    return true;
  }
  readMain(lines) {
    for (const entry of this.parse(lines)) {
      if (!this.accept(entry)) continue;
      const ms = timestampMs(entry);
      if (ms === void 0) continue;
      const agentId = entry.isSidechain === true ? str(entry.agentId) ?? "sidechain" : void 0;
      switch (entry.type) {
        case "user":
          this.user(entry, ms, agentId);
          break;
        case "assistant":
          this.assistant(entry, ms, agentId);
          break;
        case "system":
          this.system(entry, ms);
          break;
        case "queue-operation":
        case "attachment": {
          const text = entry.type === "attachment" ? JSON.stringify(entry.attachment ?? "") : str(entry.content) ?? "";
          const notice = parseNotification(text, ms);
          if (notice && (entry.type === "attachment" || entry.operation === "enqueue")) {
            this.notifications.push(notice);
          }
          break;
        }
      }
    }
    if (this.turnOpen) this.closeTurn();
  }
  readSubagent(agentId, lines) {
    const entries2 = this.parse(lines).filter((e) => this.accept(e) && timestampMs(e) !== void 0);
    const first = entries2[0];
    const last = entries2[entries2.length - 1];
    if (!first || !last) return;
    const at = this.agentTypes.get(agentId) ?? str(first.agentType);
    this.emit({
      e: "SubagentStart",
      t: timestampMs(first),
      aid: agentId,
      ...at ? { at } : {}
    });
    for (const entry of entries2) {
      const ms = timestampMs(entry);
      if (entry.type === "user") this.toolResults(entry, ms, agentId);
      else if (entry.type === "assistant") this.assistant(entry, ms, agentId);
    }
    this.emit({ e: "SubagentStop", t: timestampMs(last), aid: agentId });
  }
  user(entry, ms, agentId) {
    if (agentId) {
      this.toolResults(entry, ms, agentId);
      return;
    }
    const kind = promptKind(entry);
    if (kind === "none") {
      if (messageText(entry).startsWith("[Request interrupted"))
        this.lastActivity = Math.max(this.lastActivity, ms);
      this.toolResults(entry, ms, void 0);
      return;
    }
    if (this.turnOpen) this.closeTurn();
    const text = messageText(entry);
    if (kind === "notification") {
      const notice = parseNotification(text, ms);
      if (notice) this.notifications.push(notice);
    } else if (this.options.detail && !this.title) {
      this.title = oneLine(text);
    }
    this.emit({
      e: "UserPromptSubmit",
      t: ms,
      ...kind === "notification" ? { src: "task-notification" } : {}
    });
    this.turnOpen = true;
    this.turnStart = ms;
    this.lastActivity = ms;
    this.turnEndMark = void 0;
  }
  closeTurn() {
    const end = this.turnEndMark !== void 0 && this.turnEndMark >= this.lastActivity ? this.turnEndMark : this.lastActivity;
    this.emit({ e: "Stop", t: Math.max(end, this.turnStart) });
    this.turnOpen = false;
  }
  toolResults(entry, ms, agentId) {
    const result = obj(entry.toolUseResult);
    const decision = obj(entry.permissionDecision);
    for (const block of contentBlocks(entry)) {
      if (block.type !== "tool_result") {
        if (!BLOCK_TYPES.has(String(block.type))) this.count(`block:${String(block.type)}`);
        continue;
      }
      const tuid = str(block.tool_use_id);
      if (!tuid) continue;
      if (!agentId) this.lastActivity = Math.max(this.lastActivity, ms);
      const text = resultText(block);
      const failed = block.is_error === true;
      const source = str(decision?.source) ?? "";
      const use = this.toolUses.get(tuid);
      if (source.startsWith("user")) {
        const startEvent = this.startEvents.get(tuid);
        if (startEvent)
          this.emit({
            e: "PermissionRequest",
            t: startEvent.t,
            tool: startEvent.tool,
            ih: tuid,
            ...agentId ? { aid: agentId } : {}
          });
      }
      if (str(decision?.decision) === "reject") {
        this.emit({ e: "PermissionDenied", t: ms, tuid, ...agentId ? { aid: agentId } : {} });
        this.resolveBatch(use, tuid, ms);
        continue;
      }
      const code = failed ? EXIT_CODE.exec(text) : null;
      const event = {
        e: failed ? "PostToolUseFailure" : "PostToolUse",
        t: ms,
        tuid,
        ok: !failed
      };
      if (use) event.tool = use.name;
      if (agentId) event.aid = agentId;
      if (code) event.code = Number(code[1]);
      if (result?.interrupted === true) event.intr = true;
      const child = str(result?.agentId);
      if (child && use && (use.name === "Agent" || use.name === "Task")) {
        event.child = child;
        const type = str(result?.agentType);
        if (type && !this.agentTypes.has(child)) this.agentTypes.set(child, type);
      }
      const bgid = str(result?.backgroundTaskId);
      if (bgid) event.bgid = bgid;
      this.emit(event);
      this.resolveBatch(use, tuid, ms);
      if (this.options.detail) {
        const detail = this.details.get(tuid) ?? {};
        if (text) detail.output = clip(maskSecrets(text));
        this.details.set(tuid, detail);
      }
    }
  }
  /** When the last call of an assistant message has its result, the batch is done (like PostToolBatch). */
  resolveBatch(use, tuid, ms) {
    const batch = use?.messageId ? this.batches.get(use.messageId) : void 0;
    if (!batch || !batch.pending.delete(tuid)) return;
    batch.lastMs = Math.max(batch.lastMs, ms);
    if (batch.pending.size === 0) {
      this.emit({
        e: "PostToolBatch",
        t: batch.lastMs,
        ids: batch.ids,
        ...batch.agentId ? { aid: batch.agentId } : {}
      });
    }
  }
  assistant(entry, ms, agentId) {
    const message = obj(entry.message) ?? {};
    const messageId = str(message.id) ?? str(entry.uuid);
    if (!agentId) this.lastActivity = Math.max(this.lastActivity, ms);
    if (messageId) {
      const known = this.messages.get(messageId);
      const record = known ?? { lastMs: ms };
      record.lastMs = Math.max(record.lastMs, ms);
      if (agentId) record.agentId = agentId;
      const model = str(message.model);
      if (model && model !== "<synthetic>") record.model = model;
      const usage2 = obj(message.usage);
      if (usage2) record.tokens = tokens(usage2);
      this.messages.set(messageId, record);
    }
    if (entry.isApiErrorMessage === true && !agentId) {
      this.emit({ e: "StopFailure", t: ms, err: "api_error" });
      this.turnOpen = false;
      return;
    }
    for (const block of contentBlocks(entry)) {
      if (!BLOCK_TYPES.has(String(block.type))) this.count(`block:${String(block.type)}`);
      if (block.type !== "tool_use") continue;
      const tuid = str(block.id);
      const name = str(block.name);
      if (!tuid || !name) continue;
      const input = obj(block.input) ?? {};
      const event = {
        e: "PreToolUse",
        t: ms,
        tool: name,
        tuid,
        ih: tuid
      };
      const command = str(input.command);
      if (command) event.cmd = cleanCommand(command);
      const files = FILE_KEYS.map((key) => str(input[key])).filter((f) => !!f);
      if (files.length > 0) event.files = files;
      if (input.run_in_background === true) event.bg = true;
      const sub = str(input.subagent_type);
      if (sub) event.sub = sub;
      const ref = str(input.task_id) ?? str(input.bash_id) ?? str(input.shell_id);
      if (ref) event.bgid = ref;
      if (agentId) event.aid = agentId;
      this.emit(event);
      this.startEvents.set(tuid, this.events[this.events.length - 1]);
      const use = { name };
      if (messageId) {
        use.messageId = messageId;
        const batch = this.batches.get(messageId) ?? {
          ids: [],
          pending: /* @__PURE__ */ new Set(),
          lastMs: ms
        };
        if (agentId) batch.agentId = agentId;
        batch.ids.push(tuid);
        batch.pending.add(tuid);
        this.batches.set(messageId, batch);
      }
      if (agentId) use.agentId = agentId;
      this.toolUses.set(tuid, use);
      if (this.options.detail) {
        const description = str(input.description);
        if (description) this.details.set(tuid, { description: oneLine(description) });
      }
    }
  }
  system(entry, ms) {
    const subtype = str(entry.subtype) ?? "<none>";
    if (!SYSTEM_SUBTYPES.has(subtype)) {
      this.count(`system:${subtype}`);
      return;
    }
    if (subtype === "turn_duration" || subtype === "stop_hook_summary") {
      this.turnEndMark = Math.max(this.turnEndMark ?? 0, ms);
    } else if (subtype === "compact_boundary") {
      const meta = obj(entry.compactMetadata) ?? {};
      const duration = typeof meta.durationMs === "number" ? meta.durationMs : 0;
      const trigger = str(meta.trigger);
      this.emit({ e: "PreCompact", t: ms - duration, ...trigger ? { trigger } : {} });
      this.emit({ e: "PostCompact", t: ms, ...trigger ? { trigger } : {} });
    }
  }
  build(sessionId, file) {
    const session = eventsToSession(sessionId, this.events);
    session.sources = ["transcript"];
    session.transcriptPath = file;
    if (this.cwd) session.cwd = this.cwd;
    if (this.version) session.agentVersion = this.version;
    if (this.title) session.title = this.title;
    session.diagnostics = this.diagnostics;
    this.addBackgroundSteps(session);
    this.addModelDetails(session);
    if (this.options.detail) {
      for (const step of session.steps) {
        const detail = this.details.get(step.id);
        if (detail) step.detail = detail;
      }
    }
    if (session.steps.length > 0) {
      session.startMs = Math.min(...session.steps.map((s) => s.startMs));
      session.endMs = Math.max(...session.steps.map((s) => s.endMs));
    }
    return session;
  }
  /** A background shell runs from its call until its completion notice. */
  addBackgroundSteps(session) {
    for (const call of session.steps.filter((s) => s.kind === "tool" && s.backgroundId)) {
      const notice = this.notifications.filter(
        (n) => (n.taskId === call.backgroundId || n.toolUseId === call.id) && n.ms >= call.startMs
      ).sort((a, b) => a.ms - b.ms)[0];
      if (!notice || notice.ms < call.startMs) continue;
      const step = {
        id: `bg:${call.backgroundId}`,
        parentId: call.id,
        kind: "background",
        startMs: call.startMs,
        endMs: notice.ms,
        flags: ["background"],
        backgroundId: call.backgroundId
      };
      if (call.tool) step.tool = call.tool;
      if (call.command) step.command = call.command;
      if (call.agentId) step.agentId = call.agentId;
      if (notice.status) step.ok = notice.status === "completed";
      session.steps.push(step);
    }
  }
  /** The model and tokens of the model call behind each model step. */
  addModelDetails(session) {
    const byAgent = /* @__PURE__ */ new Map();
    for (const message of this.messages.values()) {
      const key = message.agentId ?? "";
      byAgent.set(key, [...byAgent.get(key) ?? [], message]);
    }
    for (const step of session.steps) {
      if (step.kind !== "model") continue;
      const produced = step.produces?.[0];
      const use = produced ? this.toolUses.get(produced) : void 0;
      let message = use?.messageId ? this.messages.get(use.messageId) : void 0;
      if (!message && !produced) {
        message = (byAgent.get(step.agentId ?? "") ?? []).filter((m) => m.lastMs >= step.startMs && m.lastMs <= step.endMs + 1).sort((a, b) => b.lastMs - a.lastMs)[0];
      }
      if (message?.model) step.model = message.model;
      if (message?.tokens) step.tokens = message.tokens;
    }
  }
};
function tokens(usage2) {
  const n = (key) => typeof usage2[key] === "number" ? usage2[key] : 0;
  return {
    input: n("input_tokens"),
    output: n("output_tokens"),
    cacheRead: n("cache_read_input_tokens"),
    cacheWrite: n("cache_creation_input_tokens")
  };
}
function oneLine(text) {
  const plain = text.replace(/<(system-reminder|local-command-caveat|command-message)>[\s\S]*?<\/\1>/g, " ").replace(/<command-name>([^<]*)<\/command-name>/g, "$1 ").replace(/<\/?[a-z][a-z0-9_-]*(?:\s[^>]*)?>/gi, " ").replace(/\s+/g, " ").trim();
  const masked = maskSecrets(plain);
  return masked.length > 160 ? masked.slice(0, 157) + "\u2026" : masked;
}
function clip(text) {
  if (text.length <= MAX_OUTPUT) return text;
  const head = text.slice(0, 1500);
  const tail = text.slice(-2400);
  return `${head}
\u2026 ${text.length - head.length - tail.length} characters cut \u2026
${tail}`;
}
function compareVersions(a, b) {
  const pa = a.split(/[.-]/).map((x) => Number.parseInt(x, 10) || 0);
  const pb = b.split(/[.-]/).map((x) => Number.parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

// src/importers/claude-code/locate.ts
import { existsSync as existsSync5, readdirSync as readdirSync4, statSync as statSync3 } from "node:fs";
import path8 from "node:path";
function listTranscripts(env = process.env, sinceMs = -Infinity) {
  const root = claudeProjectsDir(env);
  if (!existsSync5(root)) return [];
  const files = [];
  for (const project of readdirSync4(root)) {
    const dir = path8.join(root, project);
    let names;
    try {
      if (!statSync3(dir).isDirectory()) continue;
      names = readdirSync4(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      if (!name.endsWith(".jsonl")) continue;
      const file = path8.join(dir, name);
      try {
        const stat = statSync3(file);
        if (!stat.isFile() || stat.mtimeMs < sinceMs) continue;
        files.push({
          id: name.slice(0, -".jsonl".length),
          path: file,
          project,
          mtimeMs: stat.mtimeMs,
          size: stat.size
        });
      } catch {
      }
    }
  }
  return files;
}

// src/store/sessions.ts
function sessionIndex(env = process.env) {
  const index = /* @__PURE__ */ new Map();
  const entry = (id) => {
    let ref = index.get(id);
    if (!ref) index.set(id, ref = { id });
    return ref;
  };
  for (const file of listEventFiles(env)) entry(file.id).events = file;
  for (const id of listImportedIds(env)) entry(id).imported = true;
  for (const file of listTranscripts(env)) entry(file.id).transcript = file;
  return index;
}
function latestMs(ref) {
  return Math.max(ref.events?.mtimeMs ?? 0, ref.transcript?.mtimeMs ?? 0);
}
function resolveSession(input, env = process.env, project) {
  if (input.endsWith(".jsonl") && existsSync6(input)) {
    const stat = statSync4(input);
    const id = path9.basename(input, ".jsonl");
    const file = { id, path: path9.resolve(input), mtimeMs: stat.mtimeMs, size: stat.size };
    if (path9.basename(path9.dirname(input)) === "events") return { id, events: file };
    return { id, transcript: { ...file, project: path9.basename(path9.dirname(input)) } };
  }
  const index = sessionIndex(env);
  if (input === "last" || input === "latest" || input === "current") {
    const candidates = [...index.values()].filter((ref) => !project || refProject(ref) === project);
    const last = candidates.sort((a, b) => latestMs(b) - latestMs(a))[0];
    if (!last) throw new Error("no sessions found");
    return last;
  }
  const exact = index.get(input);
  if (exact) return exact;
  const matches = [...index.values()].filter((ref) => ref.id.startsWith(input));
  if (matches.length === 1 && matches[0]) return matches[0];
  if (matches.length > 1) {
    throw new Error(`"${input}" matches ${matches.length} sessions; type more of the ID`);
  }
  throw new Error(`no session "${input}". Run "awf sessions" to list them, or "awf import" first.`);
}
function projectKey(dir) {
  return path9.resolve(dir).replace(/[^A-Za-z0-9]/g, "-");
}
function refProject(ref) {
  return ref.transcript?.project;
}
function loadSession(ref, options = {}) {
  const env = options.env ?? process.env;
  const recorded = ref.events ? eventsToSession(ref.id, readEvents(ref.events.path)) : void 0;
  const transcriptPath = ref.transcript?.path ?? existing(recorded?.transcriptPath);
  let transcript;
  if (transcriptPath) {
    try {
      transcript = importClaudeCodeTranscript(transcriptPath, { detail: options.detail ?? false });
    } catch {
      transcript = void 0;
    }
  }
  if (recorded && transcript) return mergeSessions(recorded, transcript);
  if (recorded) return recorded;
  if (transcript) return transcript;
  const imported = readImported(ref.id, env);
  if (imported) return { ...imported.session, sources: ["import-cache"] };
  throw new Error(`session ${ref.id} has no readable data`);
}
function existing(file) {
  return file && existsSync6(file) ? file : void 0;
}
function mergeSessions(recorded, transcript) {
  const fromTranscript = new Map(transcript.steps.map((s) => [s.id, s]));
  const producerOf = /* @__PURE__ */ new Map();
  for (const step of transcript.steps) {
    if (step.kind === "model") for (const id of step.produces ?? []) producerOf.set(id, step);
  }
  const steps = recorded.steps.map((step) => {
    const merged = { ...step };
    const twin = fromTranscript.get(step.id);
    if (twin) {
      if (twin.detail) merged.detail = twin.detail;
      if (merged.exitCode === void 0 && twin.exitCode !== void 0)
        merged.exitCode = twin.exitCode;
      if (merged.ok === void 0 && twin.ok !== void 0) merged.ok = twin.ok;
      if (!merged.command && twin.command) merged.command = twin.command;
      if (!merged.backgroundId && twin.backgroundId) merged.backgroundId = twin.backgroundId;
    }
    if (step.kind === "model") {
      const produced = step.produces?.[0];
      const source = produced ? producerOf.get(produced) : transcript.steps.find(
        (t) => t.kind === "model" && !t.produces && t.agentId === step.agentId && t.startMs < step.endMs && t.endMs > step.startMs
      );
      if (source?.model) merged.model = source.model;
      if (source?.tokens) merged.tokens = source.tokens;
    }
    return merged;
  });
  const ids = new Set(steps.map((s) => s.id));
  for (const step of transcript.steps) {
    if (step.kind === "background" && step.parentId && ids.has(step.parentId) && !ids.has(step.id)) {
      steps.push(step);
    }
  }
  const session = {
    ...recorded,
    sources: ["recorder", "transcript"],
    steps,
    endMs: Math.max(recorded.endMs, ...steps.map((s) => s.endMs))
  };
  if (transcript.title) session.title = transcript.title;
  if (transcript.agentVersion) session.agentVersion = transcript.agentVersion;
  if (transcript.diagnostics) session.diagnostics = transcript.diagnostics;
  if (!session.cwd && transcript.cwd) session.cwd = transcript.cwd;
  session.transcriptPath = transcript.transcriptPath ?? recorded.transcriptPath;
  return session;
}

// src/cli/load.ts
function loadOne(ctx, ref, options, detail) {
  if (!ref)
    throw new Error('which session? Give an ID (or its first characters), "last", or a file path.');
  const project = typeof options.project === "string" ? projectKey(path10.resolve(ctx.cwd, options.project)) : void 0;
  return loadSession(resolveSession(ref, ctx.env, project), { detail, env: ctx.env });
}
function classifier(files = diskFiles()) {
  const cache = /* @__PURE__ */ new Map();
  return (session) => {
    const key = session.cwd ?? "";
    let c = cache.get(key);
    if (!c) cache.set(key, c = new Classifier(loadRules(session.cwd, files), files));
    return c.session(session);
  };
}
function loadMany(ctx, options) {
  const since = typeof options.since === "string" ? ctx.now - parseSince(options.since) : -Infinity;
  const project = typeof options.project === "string" ? path10.resolve(ctx.cwd, options.project) : void 0;
  const sessions = [];
  for (const ref of sessionIndex(ctx.env).values()) {
    const session = quick(ref, ctx.env);
    if (!session || session.steps.length === 0 || session.startMs < since) continue;
    if (project && !(session.cwd && (session.cwd === project || session.cwd.startsWith(project + path10.sep))))
      continue;
    sessions.push(session);
  }
  return sessions.sort((a, b) => a.startMs - b.startMs);
}
function quick(ref, env) {
  if (ref.events) {
    const recorded = eventsToSession(ref.id, readEvents(ref.events.path));
    if (!recorded.cwd) {
      const cached = ref.imported ? readImported(ref.id, env)?.session : void 0;
      if (cached?.cwd) recorded.cwd = cached.cwd;
    }
    return recorded;
  }
  return ref.imported ? readImported(ref.id, env)?.session : void 0;
}

// src/cli/share.ts
function shareSession(session) {
  const ids = /* @__PURE__ */ new Map();
  const anon = (id) => {
    if (!id) return null;
    if (!ids.has(id)) ids.set(id, `s${ids.size + 1}`);
    return ids.get(id);
  };
  for (const step of session.steps) anon(step.id);
  const steps = session.steps.map((s) => {
    const shared = {
      id: anon(s.id),
      parentId: anon(s.parentId),
      kind: s.kind,
      startMs: s.startMs,
      endMs: s.endMs,
      flags: s.flags,
      tags: s.tags.filter((t) => !/^(script|make|task|file|hook|via|unmatched):/.test(t)),
      checks: s.checks.map((c) => {
        const tool = c.tool.replace(/^(npm|pnpm|yarn|bun|deno|make) .*/, "$1");
        return { ...c, tool, key: `${c.phase}:${tool}` };
      }),
      failed: s.failed
    };
    if (s.tool)
      shared.tool = s.tool.startsWith("mcp__") ? `mcp__${s.tool.split("__")[1] ?? ""}` : s.tool;
    if (s.phase) shared.phase = s.phase;
    if (s.ok !== void 0) shared.ok = s.ok;
    if (s.runMs !== void 0) shared.runMs = s.runMs;
    if (s.waitMs !== void 0) shared.waitMs = s.waitMs;
    if (s.agentType) shared.agentType = s.agentType;
    if (s.model) shared.model = s.model;
    if (s.tokens) shared.tokens = s.tokens;
    if (s.produces) shared.produces = s.produces.map((id) => anon(id));
    if (s.reworkFor) shared.reworkFor = s.reworkFor;
    return shared;
  });
  return {
    id: session.id,
    agent: session.agent,
    sources: session.sources,
    startMs: session.startMs,
    endMs: session.endMs,
    steps,
    ...session.agentVersion ? { agentVersion: session.agentVersion } : {}
  };
}

// src/cli/table.ts
function table(header, rows, right = []) {
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length)));
  const line = (cells) => cells.map(
    (cell, i) => right.includes(i) ? cell.padStart(widths[i] ?? 0) : cell.padEnd(widths[i] ?? 0)
  ).join("  ").trimEnd();
  return [line(header), ...rows.map(line)].join("\n");
}
function homeRelative(file, home) {
  if (!file) return "";
  return home && (file === home || file.startsWith(home + "/")) ? "~" + file.slice(home.length) : file;
}

// src/cli/commands/classify.ts
function offset(ms) {
  const s = Math.max(0, Math.round(ms / 1e3));
  const h = Math.floor(s / 3600);
  const m = Math.floor(s % 3600 / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `+${h}:${String(m).padStart(2, "0")}:${sec}` : `+${m}:${sec}`;
}
function label(step) {
  switch (step.kind) {
    case "turn":
      return step.flags.includes("notification") ? "turn (background notice)" : "turn";
    case "subagent":
      return `subagent ${step.agentType ?? ""}`.trim();
    case "model":
      return "model";
    case "idle":
      return "idle";
    case "compact":
      return "compaction";
    case "background":
      return `background: ${step.command ?? ""}`;
    default:
      return [step.tool, step.command ?? (step.files ?? []).join(" ")].filter(Boolean).join(": ");
  }
}
var classifyCommand = {
  summary: "Show every step of a session with its phase",
  usage: `Usage: awf classify <session> [--json] [--share] [--detail]

Lists each step (turns, model time, tool calls, subagents) with its phase, tags and failures.
<session> is an ID or its first characters, "last", or a transcript or events file.
  --json     print JSON
  --share    phases, durations and tool names only (no commands, files or output)
  --detail   with --json, include output from the transcript (masked)`,
  options: {
    json: { type: "boolean" },
    share: { type: "boolean" },
    detail: { type: "boolean" },
    project: { type: "string" }
  },
  run(ctx, args, options) {
    const session = classifier()(loadOne(ctx, args[0], options, true));
    if (options.json) {
      const out = options.share ? shareSession(session) : options.detail ? session : withoutDetail(session);
      ctx.io.out(JSON.stringify(out, null, 2));
      return 0;
    }
    const shown = options.share ? shareSession(session) : session;
    const home = ctx.env.HOME ?? os3.homedir();
    ctx.io.out(
      `Session ${session.id.slice(0, 8)} \xB7 ${formatClock(session.startMs)} \xB7 ${formatDuration(session.endMs - session.startMs)}` + (shown.cwd ? ` \xB7 ${homeRelative(shown.cwd, home)}` : "")
    );
    const depth = /* @__PURE__ */ new Map();
    const byId = new Map(shown.steps.map((s) => [s.id, s]));
    const level = (s) => {
      if (depth.has(s.id)) return depth.get(s.id);
      const parent = s.parentId ? byId.get(s.parentId) : void 0;
      const d = parent ? level(parent) + 1 : 0;
      depth.set(s.id, d);
      return d;
    };
    const ordered = [...shown.steps].sort((a, b) => a.startMs - b.startMs || level(a) - level(b));
    for (const step of ordered) {
      const phase = step.phase ? PHASE_LABEL[step.phase] : "";
      const notes = [
        step.failed ? "FAILED" : "",
        ...step.flags.filter((f) => f !== "answer"),
        ...step.tags.filter((t) => !t.startsWith("unmatched:"))
      ].filter(Boolean);
      const text = label(step).replace(/\s+/g, " ");
      ctx.io.out(
        [
          offset(step.startMs - session.startMs).padStart(9),
          formatDuration(step.endMs - step.startMs).padStart(8),
          phase.padEnd(22),
          "  ".repeat(level(step)) + (text.length > 90 ? text.slice(0, 89) + "\u2026" : text),
          notes.length > 0 ? `[${notes.join(", ")}]` : ""
        ].join("  ").trimEnd()
      );
    }
    return 0;
  }
};
function withoutDetail(session) {
  return { ...session, steps: session.steps.map(({ detail: _detail, ...rest }) => rest) };
}

// src/cli/commands/doctor.ts
import os4 from "node:os";
var doctorCommand = {
  summary: "Check the recorder and list transcript entries awf does not recognise",
  usage: `Usage: awf doctor [--json]

Shows whether the recorder is writing events, where awf reads and writes, and every transcript entry
type the importer didn't recognise, with the Claude Code versions that wrote it. Run it after a
Claude Code update. It reads what "awf import" stored, so run that first.`,
  options: { json: { type: "boolean" } },
  run(ctx, _args, options) {
    const events = listEventFiles(ctx.env);
    const lastEvent = Math.max(0, ...events.map((f) => f.mtimeMs));
    const transcripts = listTranscripts(ctx.env, ctx.now - 30 * 864e5);
    const imported = listImportedIds(ctx.env);
    const unknown = /* @__PURE__ */ new Map();
    for (const id of imported) {
      const session = readImported(id, ctx.env)?.session;
      for (const [type, count] of Object.entries(session?.diagnostics?.unknownEntries ?? {})) {
        const entry = unknown.get(type) ?? { count: 0, versions: /* @__PURE__ */ new Set() };
        entry.count += count;
        if (session?.agentVersion) entry.versions.add(session.agentVersion);
        unknown.set(type, entry);
      }
    }
    const report = {
      awf: VERSION,
      node: process.version,
      awfHome: awfHome(ctx.env),
      claudeProjects: claudeProjectsDir(ctx.env),
      recordedSessions: events.length,
      lastEventMs: lastEvent || null,
      transcriptsLast30Days: transcripts.length,
      importedSessions: imported.length,
      unknownEntries: Object.fromEntries(
        [...unknown].map(([type, u]) => [
          type,
          { count: u.count, versions: [...u.versions].sort() }
        ])
      )
    };
    if (options.json) {
      ctx.io.out(JSON.stringify(report, null, 2));
      return 0;
    }
    const home = ctx.env.HOME ?? os4.homedir();
    const recorder = events.length === 0 ? "no events yet. Install the plugin: claude plugin install awf@awf" : `${events.length} sessions, last event ${formatDuration(ctx.now - lastEvent)} ago`;
    ctx.io.out(
      [
        `awf ${VERSION} on Node ${process.version}`,
        `Writes:   ${homeRelative(report.awfHome, home)} (events/, imported/)`,
        `Reads:    ${homeRelative(report.claudeProjects, home)} (never changes it)`,
        `Recorder: ${recorder}`,
        `Transcripts changed in the last 30 days: ${transcripts.length}; imported sessions: ${imported.length}`
      ].join("\n")
    );
    if (unknown.size === 0) {
      ctx.io.out(
        imported.length > 0 ? "Unknown transcript entries: none." : 'Run "awf import" to check transcripts.'
      );
    } else {
      ctx.io.out("Unknown transcript entries (skipped; new in a Claude Code update?):");
      ctx.io.out(
        table(
          ["TYPE", "COUNT", "CLAUDE CODE"],
          [...unknown].sort((a, b) => b[1].count - a[1].count).map(([type, u]) => [type, String(u.count), [...u.versions].sort().join(", ")]),
          [1]
        )
      );
    }
    return 0;
  }
};

// src/cli/commands/import.ts
import os5 from "node:os";
import path11 from "node:path";
function inProject(folder, dir) {
  if (!dir) return true;
  const key = projectKey(dir);
  return folder === key || folder.startsWith(key + "-");
}
var importCommand = {
  summary: "Import past sessions from Claude Code transcripts (read-only)",
  usage: `Usage: awf import [--since 30d] [--project <dir>] [--force] [--dry-run] [--json]

Reads every transcript under ~/.claude/projects/ (read-only) and keeps the timings in ~/.awf/imported/,
so your history survives Claude Code deleting transcripts after 30 days. Prints the sessions, steps
and any transcript entries awf doesn't recognise.
  --since <age>     only transcripts changed within this age
  --project <dir>   only sessions started in this folder or below it
  --force           re-import transcripts that haven't changed
  --dry-run         read and report, but write nothing
  --json            print JSON`,
  options: {
    since: { type: "string" },
    project: { type: "string" },
    force: { type: "boolean" },
    "dry-run": { type: "boolean" },
    json: { type: "boolean" }
  },
  run(ctx, _args, options) {
    const since = typeof options.since === "string" ? ctx.now - parseSince(options.since) : -Infinity;
    const project = typeof options.project === "string" ? path11.resolve(ctx.cwd, options.project) : void 0;
    const files = listTranscripts(ctx.env, since).filter((f) => inProject(f.project, project));
    const report = {
      transcripts: files.length,
      imported: 0,
      unchanged: 0,
      steps: 0,
      toolCalls: 0,
      unknownEntries: {},
      badLines: 0,
      versions: [],
      errors: []
    };
    const versions = /* @__PURE__ */ new Set();
    for (const file of files) {
      let session;
      const cached = options.force ? void 0 : readImported(file.id, ctx.env);
      if (cached && cached.source.mtimeMs === file.mtimeMs && cached.source.size === file.size) {
        session = cached.session;
        report.unchanged++;
      } else {
        try {
          session = importClaudeCodeTranscript(file.path);
        } catch (error) {
          report.errors.push({
            file: file.path,
            message: error instanceof Error ? error.message : String(error)
          });
          continue;
        }
        if (!options["dry-run"]) {
          writeImported(
            {
              version: 1,
              source: { path: file.path, mtimeMs: file.mtimeMs, size: file.size },
              session: stripDetail(session)
            },
            ctx.env
          );
        }
        report.imported++;
      }
      report.steps += session.steps.length;
      report.toolCalls += session.steps.filter((s) => s.kind === "tool").length;
      report.badLines += session.diagnostics?.badLines ?? 0;
      if (session.agentVersion) versions.add(session.agentVersion);
      for (const [type, count] of Object.entries(session.diagnostics?.unknownEntries ?? {})) {
        const entry = report.unknownEntries[type] ??= { count: 0, versions: [] };
        entry.count += count;
        if (session.agentVersion && !entry.versions.includes(session.agentVersion)) {
          entry.versions.push(session.agentVersion);
        }
      }
    }
    report.versions = [...versions].sort();
    if (options.json) {
      ctx.io.out(JSON.stringify(report, null, 2));
      return report.errors.length > 0 ? 1 : 0;
    }
    const home = ctx.env.HOME ?? os5.homedir();
    const verb = options["dry-run"] ? "Read" : "Imported";
    ctx.io.out(
      `${verb} ${report.transcripts - report.errors.length} of ${report.transcripts} sessions from ${homeRelative(claudeProjectsDir(ctx.env), home)} (${report.imported} new or changed, ${report.unchanged} unchanged): ${report.steps.toLocaleString("en-US")} steps, ${report.toolCalls.toLocaleString("en-US")} tool calls.`
    );
    if (report.versions.length > 0) {
      ctx.io.out(
        `Claude Code versions: ${report.versions[0]} to ${report.versions[report.versions.length - 1]}.`
      );
    }
    const unknown = Object.entries(report.unknownEntries).sort((a, b) => b[1].count - a[1].count);
    if (unknown.length === 0) {
      ctx.io.out("Unknown entries: none.");
    } else {
      ctx.io.out(`Unknown entries (${unknown.length} types, counted and skipped):`);
      ctx.io.out(
        table(
          ["TYPE", "COUNT", "CLAUDE CODE"],
          unknown.map(([type, u]) => [type, String(u.count), u.versions.sort().join(", ")]),
          [1]
        )
      );
    }
    if (report.badLines > 0) ctx.io.out(`Lines that weren't valid JSON: ${report.badLines}.`);
    if (report.errors.length > 0) {
      ctx.io.out(`Failed: ${report.errors.length} files`);
      for (const error of report.errors)
        ctx.io.out(`  ${homeRelative(error.file, home)}: ${error.message}`);
      return 1;
    }
    return 0;
  }
};

// src/cli/commands/sample.ts
import { readFileSync as readFileSync5 } from "node:fs";
import path12 from "node:path";
function random(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = Math.imul(s, 1664525) + 1013904223 >>> 0;
    return s / 2 ** 32;
  };
}
var PHASE_IDS = new Set(PHASES.map((p) => p.id));
function csvCell(value) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}
var sampleCommand = {
  summary: "Pick random Bash steps to check by hand, or to label as a CSV",
  usage: `Usage: awf sample [--n 50] [--seed 1] [--since 30d] [--project <dir>] [--csv]

Prints random Bash calls from your sessions with the phase awf gave each, for a hand check.
With --csv it writes "command,cwd,awf_phase,your_phase": fill in your_phase with a phase id
(${PHASES.map((p) => p.id).join(", ")}) and run "awf accuracy <file>".`,
  options: {
    n: { type: "string" },
    seed: { type: "string" },
    since: { type: "string" },
    project: { type: "string" },
    csv: { type: "boolean" }
  },
  run(ctx, _args, options) {
    const n = typeof options.n === "string" ? Number.parseInt(options.n, 10) || 50 : 50;
    const next = random(
      typeof options.seed === "string" ? Number.parseInt(options.seed, 10) || 1 : 1
    );
    const classify = classifier();
    const pool = [];
    const seen = /* @__PURE__ */ new Set();
    for (const session of loadMany(ctx, options).map(classify)) {
      for (const step of session.steps) {
        if (step.kind !== "tool" || step.tool !== "Bash" || !step.command || seen.has(step.command))
          continue;
        seen.add(step.command);
        pool.push({
          command: step.command,
          cwd: session.cwd ?? "",
          phase: step.phase ?? "unclassified"
        });
      }
    }
    const picked = [];
    while (picked.length < n && pool.length > 0)
      picked.push(...pool.splice(Math.floor(next() * pool.length), 1));
    if (options.csv) {
      ctx.io.out("command,cwd,awf_phase,your_phase");
      for (const p of picked) ctx.io.out([p.command, p.cwd, p.phase, ""].map(csvCell).join(","));
      return 0;
    }
    ctx.io.out(
      table(
        ["#", "AWF SAYS", "COMMAND"],
        picked.map((p, i) => {
          const line = p.command.replace(/\s+/g, " ");
          return [
            String(i + 1),
            PHASE_LABEL[p.phase],
            line.length > 110 ? line.slice(0, 109) + "\u2026" : line
          ];
        })
      )
    );
    ctx.io.out(
      `
${picked.length} of ${seen.size} distinct Bash commands. Count the ones you disagree with.`
    );
    return 0;
  }
};
var accuracyCommand = {
  summary: 'Compare awf with your own labels from "awf sample --csv"',
  usage: `Usage: awf accuracy <labels.csv> [--json]

Re-classifies each labelled command with the current rules and reports agreement per phase.`,
  options: { json: { type: "boolean" } },
  run(ctx, args, options) {
    const file = args[0];
    if (!file) throw new Error("give the labels file, for example fixtures/labels.csv");
    const rows = parseCsv(readFileSync5(path12.resolve(ctx.cwd, file), "utf8"));
    const header = rows.shift() ?? [];
    const col = (name) => header.indexOf(name);
    const [ci, wi, yi] = [col("command"), col("cwd"), col("your_phase")];
    if (ci < 0 || yi < 0) throw new Error('the CSV needs "command" and "your_phase" columns');
    const files = diskFiles();
    const perPhase = /* @__PURE__ */ new Map();
    const misses = [];
    let total = 0;
    let agree = 0;
    for (const row of rows) {
      const yours = (row[yi] ?? "").trim();
      if (!yours) continue;
      if (!PHASE_IDS.has(yours))
        throw new Error(`unknown phase "${yours}"; use one of ${[...PHASE_IDS].join(", ")}`);
      const cwd = (wi >= 0 ? row[wi] : "") || ctx.cwd;
      const awf = new Classifier(loadRules(cwd, files), files).command(row[ci] ?? "", cwd).phase;
      const entry = perPhase.get(yours) ?? { total: 0, agree: 0 };
      entry.total++;
      total++;
      if (awf === yours) {
        entry.agree++;
        agree++;
      } else misses.push({ command: row[ci] ?? "", yours, awf });
      perPhase.set(yours, entry);
    }
    const report = {
      labelled: total,
      agree,
      accuracy: total > 0 ? agree / total : 0,
      perPhase: Object.fromEntries(
        [...perPhase].map(([p, v]) => [p, { ...v, accuracy: v.agree / v.total }])
      ),
      misses
    };
    if (options.json) {
      ctx.io.out(JSON.stringify(report, null, 2));
      return 0;
    }
    ctx.io.out(
      `awf agrees with ${agree} of ${total} labels (${((report.accuracy || 0) * 100).toFixed(1)}%).
`
    );
    ctx.io.out(
      table(
        ["YOUR PHASE", "LABELS", "AGREE", "ACCURACY"],
        [...perPhase].map(([p, v]) => [
          PHASE_LABEL[p] ?? p,
          String(v.total),
          String(v.agree),
          `${(v.agree / v.total * 100).toFixed(0)}%`
        ]),
        [1, 2, 3]
      )
    );
    if (misses.length > 0) {
      ctx.io.out("\nDisagreements:");
      for (const m of misses.slice(0, 30))
        ctx.io.out(`  ${m.yours} (awf: ${m.awf})  ${m.command.replace(/\s+/g, " ").slice(0, 100)}`);
    }
    return 0;
  }
};

// src/cli/commands/sessions.ts
import os6 from "node:os";
import path13 from "node:path";
function sessionRow(session) {
  const idleMs = session.steps.filter((s) => s.kind === "idle").reduce((sum, s) => sum + (s.endMs - s.startMs), 0);
  const durationMs = Math.max(0, session.endMs - session.startMs);
  const row = {
    id: session.id,
    startMs: session.startMs,
    endMs: session.endMs,
    durationMs,
    activeMs: Math.max(0, durationMs - idleMs),
    turns: session.steps.filter((s) => s.kind === "turn").length,
    toolCalls: session.steps.filter((s) => s.kind === "tool").length,
    sources: session.sources
  };
  if (session.cwd) row.cwd = session.cwd;
  return row;
}
function inFolder(cwd, dir) {
  if (!dir) return true;
  return !!cwd && (cwd === dir || cwd.startsWith(dir + path13.sep));
}
function listSessionRows(env) {
  const rows = [];
  for (const ref of sessionIndex(env).values()) {
    const recorded = ref.events ? eventsToSession(ref.id, readEvents(ref.events.path)) : void 0;
    const imported = ref.imported ? readImported(ref.id, env)?.session : void 0;
    const base = recorded ?? imported;
    if (!base || base.steps.length === 0) continue;
    const row = sessionRow(base);
    row.sources = [...recorded ? ["hooks"] : [], ...imported ? ["transcript"] : []];
    if (!row.cwd && imported?.cwd) row.cwd = imported.cwd;
    rows.push(row);
  }
  return rows.sort((a, b) => b.startMs - a.startMs);
}
var sessionsCommand = {
  summary: "List sessions with start time and duration",
  usage: `Usage: awf sessions [--since 30d] [--project <dir>] [--json]

Lists sessions newest first: those the recorder captured and those "awf import" read from transcripts.
  --since <age>     only sessions that started within this age (30d, 12h)
  --project <dir>   only sessions started in this folder or below it
  --json            print JSON`,
  options: {
    since: { type: "string" },
    project: { type: "string" },
    json: { type: "boolean" }
  },
  run(ctx, _args, options) {
    const since = typeof options.since === "string" ? ctx.now - parseSince(options.since) : -Infinity;
    const project = typeof options.project === "string" ? path13.resolve(ctx.cwd, options.project) : void 0;
    const rows = listSessionRows(ctx.env).filter(
      (row) => row.startMs >= since && inFolder(row.cwd, project)
    );
    if (options.json) {
      ctx.io.out(JSON.stringify(rows, null, 2));
      return 0;
    }
    if (rows.length === 0) {
      ctx.io.out(
        'No sessions yet. Install the awf plugin to record new sessions, or run "awf import" to read past ones.'
      );
      return 0;
    }
    const home = ctx.env.HOME ?? os6.homedir();
    ctx.io.out(
      table(
        ["SESSION", "STARTED", "DURATION", "ACTIVE", "TURNS", "TOOLS", "SOURCE", "PROJECT"],
        rows.map((r) => [
          r.id.slice(0, 8),
          formatClock(r.startMs),
          formatDuration(r.durationMs),
          formatDuration(r.activeMs),
          String(r.turns),
          String(r.toolCalls),
          r.sources.join("+"),
          homeRelative(r.cwd, home)
        ]),
        [2, 3, 4, 5]
      )
    );
    return 0;
  }
};

// src/cli/commands/stats.ts
function runMs(step) {
  return Math.max(0, step.endMs - step.startMs - (step.waitMs ?? 0));
}
var NEUTRAL_HEADS = /* @__PURE__ */ new Set([
  "cd",
  "export",
  "echo",
  "printf",
  "set",
  "source",
  ".",
  "true",
  "false",
  ":",
  "sleep",
  "[",
  "[[",
  "test",
  "unset",
  "local",
  "eval",
  "pushd",
  "popd",
  "wait"
]);
function commandHead(command) {
  const simple = splitCommand(command).map((c) => unwrap(c.argv).argv).filter((argv2) => argv2.length > 0);
  const argv = simple.find((a) => !NEUTRAL_HEADS.has(programName(a[0] ?? ""))) ?? simple[0];
  if (!argv) return "(empty)";
  const program = programName(argv[0] ?? "");
  const sub = argv[1];
  return sub && /^[a-z][a-z-]{1,20}$/.test(sub) ? `${program} ${sub}` : program;
}
function bashStats(sessions, top = 10, focus = "unclassified") {
  const byPhase = /* @__PURE__ */ new Map();
  const heads = /* @__PURE__ */ new Map();
  const others = /* @__PURE__ */ new Map();
  let bashMs = 0;
  let bashCalls = 0;
  for (const session of sessions) {
    for (const step of session.steps) {
      if (step.kind !== "tool" || step.flags.includes("background")) continue;
      const ms = runMs(step);
      if (step.tool !== "Bash") {
        if (step.phase === "unclassified") {
          const tool = step.tool?.startsWith("mcp__") ? `mcp__${step.tool.split("__")[1] ?? ""}` : step.tool ?? "?";
          const entry2 = others.get(tool) ?? { ms: 0, calls: 0 };
          entry2.ms += ms;
          entry2.calls++;
          others.set(tool, entry2);
        }
        continue;
      }
      const phase = step.phase ?? "unclassified";
      bashMs += ms;
      bashCalls++;
      const entry = byPhase.get(phase) ?? { ms: 0, calls: 0 };
      entry.ms += ms;
      entry.calls++;
      byPhase.set(phase, entry);
      if (phase === focus) {
        const unmatched = step.tags.find((t) => t.startsWith("unmatched:"))?.slice("unmatched:".length);
        const head = focus === "unclassified" && step.tags.includes("polling") ? "(polling: sleep in a loop, or a long sleep)" : focus === "unclassified" && unmatched ? unmatched : step.command ? commandHead(step.command) : "(no command)";
        const h = heads.get(head) ?? { ms: 0, calls: 0 };
        h.ms += ms;
        h.calls++;
        heads.set(head, h);
      }
    }
  }
  const unclassifiedMs = byPhase.get("unclassified")?.ms ?? 0;
  const sorted = (map, key) => [...map].sort((a, b) => b[1].ms - a[1].ms).slice(0, top).map(
    ([name, v]) => ({ [key]: name, ...v })
  );
  return {
    sessions: sessions.length,
    bashMs,
    bashCalls,
    unclassifiedMs,
    unclassifiedShare: bashMs > 0 ? unclassifiedMs / bashMs : 0,
    byPhase: PHASES.filter((p) => byPhase.has(p.id)).map((p) => {
      const v = byPhase.get(p.id);
      return { phase: p.id, ...v, share: bashMs > 0 ? v.ms / bashMs : 0 };
    }),
    topUnclassified: sorted(heads, "program"),
    otherUnclassified: sorted(others, "tool")
  };
}
var pct = (x) => `${(x * 100).toFixed(1)}%`;
var statsCommand = {
  summary: "Share of Bash time each phase got, and what is left unclassified",
  usage: `Usage: awf stats [--since 30d] [--project <dir>] [--top 10] [--phase <id>] [--json]

Classifies the Bash calls of every recorded or imported session and shows the time per phase,
the share left unclassified, and the programs behind that time, to show which rules are missing.
  --phase <id>   break this phase down by program instead of unclassified (tests, build, exploring, ...)`,
  options: {
    since: { type: "string" },
    project: { type: "string" },
    top: { type: "string" },
    phase: { type: "string" },
    json: { type: "boolean" }
  },
  run(ctx, _args, options) {
    const classify = classifier();
    const sessions = loadMany(ctx, options).map(classify);
    const top = typeof options.top === "string" ? Number.parseInt(options.top, 10) || 10 : 10;
    const focus = typeof options.phase === "string" ? options.phase : "unclassified";
    if (!PHASES.some((p) => p.id === focus))
      throw new Error(`unknown phase "${focus}"; use one of ${PHASES.map((p) => p.id).join(", ")}`);
    const stats = bashStats(sessions, top, focus);
    if (options.json) {
      ctx.io.out(JSON.stringify(stats, null, 2));
      return 0;
    }
    if (stats.bashCalls === 0) {
      ctx.io.out(
        'No Bash calls found. Run "awf import" first, or record a session with the plugin.'
      );
      return 0;
    }
    ctx.io.out(
      `Bash time: ${formatDuration(stats.bashMs)} in ${stats.bashCalls.toLocaleString("en-US")} calls across ${stats.sessions} sessions. Unclassified: ${pct(stats.unclassifiedShare)}.`
    );
    ctx.io.out("");
    ctx.io.out(
      table(
        ["PHASE", "TIME", "SHARE", "CALLS"],
        stats.byPhase.map((p) => [
          PHASE_LABEL[p.phase],
          formatDuration(p.ms),
          pct(p.share),
          p.calls.toLocaleString("en-US")
        ]),
        [1, 2, 3]
      )
    );
    if (stats.topUnclassified.length > 0) {
      ctx.io.out("");
      ctx.io.out(
        focus === "unclassified" ? "Unclassified Bash time by program (add rules for these in .awf/rules.yaml):" : `${PHASE_LABEL[focus]} Bash time by program:`
      );
      ctx.io.out(
        table(
          ["PROGRAM", "TIME", "CALLS"],
          stats.topUnclassified.map((h) => [h.program, formatDuration(h.ms), String(h.calls)]),
          [1, 2]
        )
      );
    }
    if (stats.otherUnclassified.length > 0) {
      ctx.io.out("");
      ctx.io.out("Unclassified time of other tools:");
      ctx.io.out(
        table(
          ["TOOL", "TIME", "CALLS"],
          stats.otherUnclassified.map((h) => [h.tool, formatDuration(h.ms), String(h.calls)]),
          [1, 2]
        )
      );
    }
    return 0;
  }
};

// src/cli/main.ts
var defaultIo = {
  out: (text) => process.stdout.write(text + "\n"),
  err: (text) => process.stderr.write(text + "\n")
};
var COMMANDS = {
  sessions: sessionsCommand,
  import: importCommand,
  classify: classifyCommand,
  stats: statsCommand,
  sample: sampleCommand,
  accuracy: accuracyCommand,
  doctor: doctorCommand
};
function usage() {
  const width = Math.max(...Object.keys(COMMANDS).map((name) => name.length));
  const lines = Object.entries(COMMANDS).map(
    ([name, command]) => `  ${name.padEnd(width)}  ${command.summary}`
  );
  return [
    `awf ${VERSION}: where a coding agent's time went, by phase.`,
    "",
    "Usage: awf <command> [options]",
    "",
    "Commands:",
    ...lines,
    "",
    'Run "awf <command> --help" for its options. Every command takes --json.'
  ].join("\n");
}
async function main(argv, io = defaultIo, env = process.env, cwd = process.cwd(), now = Date.now()) {
  const [name, ...rest] = argv;
  if (name === "--version" || name === "-v") {
    io.out(VERSION);
    return 0;
  }
  if (!name || name === "--help" || name === "-h" || name === "help") {
    io.out(usage());
    return 0;
  }
  const command = COMMANDS[name];
  if (!command) {
    io.err(`awf: unknown command "${name}". Run "awf --help".`);
    return 2;
  }
  let parsed;
  try {
    parsed = parseArgs({
      args: rest,
      options: { ...command.options, help: { type: "boolean", short: "h" } },
      allowPositionals: true,
      strict: true
    });
  } catch (error) {
    io.err(`awf ${name}: ${error instanceof Error ? error.message : String(error)}`);
    io.err(command.usage);
    return 2;
  }
  if (parsed.values.help) {
    io.out(command.usage);
    return 0;
  }
  try {
    return await command.run({ io, env, cwd, now }, parsed.positionals, parsed.values);
  } catch (error) {
    io.err(`awf ${name}: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

// src/cli/bin.ts
process.stdout.on("error", (error) => {
  if (error.code === "EPIPE") process.exit(0);
  throw error;
});
main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (error) => {
    process.stderr.write(`awf: ${error instanceof Error ? error.message : String(error)}
`);
    process.exitCode = 1;
  }
);
