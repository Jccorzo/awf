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
    function visit_(key, node, visitor, path24) {
      const ctrl = callVisitor(key, node, visitor, path24);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path24, ctrl);
        return visit_(key, ctrl, visitor, path24);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path24 = Object.freeze(path24.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = visit_(i, node.items[i], visitor, path24);
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
          path24 = Object.freeze(path24.concat(node));
          const ck = visit_("key", node.key, visitor, path24);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = visit_("value", node.value, visitor, path24);
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
    async function visitAsync_(key, node, visitor, path24) {
      const ctrl = await callVisitor(key, node, visitor, path24);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path24, ctrl);
        return visitAsync_(key, ctrl, visitor, path24);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path24 = Object.freeze(path24.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = await visitAsync_(i, node.items[i], visitor, path24);
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
          path24 = Object.freeze(path24.concat(node));
          const ck = await visitAsync_("key", node.key, visitor, path24);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = await visitAsync_("value", node.value, visitor, path24);
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
    function callVisitor(key, node, visitor, path24) {
      if (typeof visitor === "function")
        return visitor(key, node, path24);
      if (identity.isMap(node))
        return visitor.Map?.(key, node, path24);
      if (identity.isSeq(node))
        return visitor.Seq?.(key, node, path24);
      if (identity.isPair(node))
        return visitor.Pair?.(key, node, path24);
      if (identity.isScalar(node))
        return visitor.Scalar?.(key, node, path24);
      if (identity.isAlias(node))
        return visitor.Alias?.(key, node, path24);
      return void 0;
    }
    function replaceNode(key, path24, node) {
      const parent = path24[path24.length - 1];
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
    function applyReviver(reviver, obj4, key, val) {
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
      return reviver.call(obj4, key, val);
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
          for (const { count: count2, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count2);
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
        let count2 = 0;
        for (const item of node.items) {
          const c = getAliasCount(doc, item, anchors2);
          if (c > count2)
            count2 = c;
        }
        return count2;
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
    function collectionFromPath(schema, path24, value) {
      let v = value;
      for (let i = path24.length - 1; i >= 0; --i) {
        const k = path24[i];
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
    var isEmptyPath = (path24) => path24 == null || typeof path24 === "object" && !!path24[Symbol.iterator]().next().done;
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
      addIn(path24, value) {
        if (isEmptyPath(path24))
          this.add(value);
        else {
          const [key, ...rest] = path24;
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
      deleteIn(path24) {
        const [key, ...rest] = path24;
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
      getIn(path24, keepScalar) {
        const [key, ...rest] = path24;
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
      hasIn(path24) {
        const [key, ...rest] = path24;
        if (rest.length === 0)
          return this.has(key);
        const node = this.get(key, true);
        return identity.isCollection(node) ? node.hasIn(rest) : false;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path24, value) {
        const [key, ...rest] = path24;
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
    var stringifyComment = (str4) => str4.replace(/^(?!$)(?: $)?/gm, "#");
    function indentComment(comment, indent) {
      if (/^\n+$/.test(comment))
        return comment.substring(1);
      return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
    }
    var lineComment = (str4, indent, comment) => str4.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str4.endsWith(" ") ? "" : " ") + comment;
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
    var containsDocumentMarker = (str4) => /^(%|---|\.\.\.)/m.test(str4);
    function lineLengthOverLimit(str4, lineWidth, indentLength) {
      if (!lineWidth || lineWidth < 0)
        return false;
      const limit = lineWidth - indentLength;
      const strLen = str4.length;
      if (strLen <= limit)
        return false;
      for (let i = 0, start = 0; i < strLen; ++i) {
        if (str4[i] === "\n") {
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
      let str4 = "";
      let start = 0;
      for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
        if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
          str4 += json.slice(start, i) + "\\ ";
          i += 1;
          start = i;
          ch = "\\";
        }
        if (ch === "\\")
          switch (json[i + 1]) {
            case "u":
              {
                str4 += json.slice(start, i);
                const code = json.substr(i + 2, 4);
                switch (code) {
                  case "0000":
                    str4 += "\\0";
                    break;
                  case "0007":
                    str4 += "\\a";
                    break;
                  case "000b":
                    str4 += "\\v";
                    break;
                  case "001b":
                    str4 += "\\e";
                    break;
                  case "0085":
                    str4 += "\\N";
                    break;
                  case "00a0":
                    str4 += "\\_";
                    break;
                  case "2028":
                    str4 += "\\L";
                    break;
                  case "2029":
                    str4 += "\\P";
                    break;
                  default:
                    if (code.substr(0, 2) === "00")
                      str4 += "\\x" + code.substr(2);
                    else
                      str4 += json.substr(i, 6);
                }
                i += 5;
                start = i + 1;
              }
              break;
            case "n":
              if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
                i += 1;
              } else {
                str4 += json.slice(start, i) + "\n\n";
                while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                  str4 += "\n";
                  i += 2;
                }
                str4 += indent;
                if (json[i + 2] === " ")
                  str4 += "\\";
                i += 1;
                start = i + 1;
              }
              break;
            default:
              i += 1;
          }
      }
      str4 = start ? str4 + json.slice(start) : json;
      return implicitKey ? str4 : foldFlowLines.foldFlowLines(str4, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
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
      let header2 = (startWithSpace ? indentSize : "") + chomp;
      if (comment) {
        header2 += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
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
          return `>${header2}
${indent}${body}`;
      }
      value = value.replace(/\n+/g, `$&${indent}`);
      return `|${header2}
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
      const str4 = value.replace(/\n+/g, `$&
${indent}`);
      if (actualString) {
        const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str4);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
          return quotedString(value, ctx);
      }
      return implicitKey ? str4 : foldFlowLines.foldFlowLines(str4, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
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
      let obj4;
      if (identity.isScalar(item)) {
        obj4 = item.value;
        let match = tags.filter((t) => t.identify?.(obj4));
        if (match.length > 1) {
          const testMatch = match.filter((t) => t.test);
          if (testMatch.length > 0)
            match = testMatch;
        }
        tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
      } else {
        obj4 = item;
        tagObj = tags.find((t) => t.nodeClass && obj4 instanceof t.nodeClass);
      }
      if (!tagObj) {
        const name = obj4?.constructor?.name ?? (obj4 === null ? "null" : typeof obj4);
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
      const str4 = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
      if (!props)
        return str4;
      return identity.isScalar(node) || str4[0] === "{" || str4[0] === "[" ? `${props} ${str4}` : `${props}
${ctx.indent}${str4}`;
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
      let str4 = stringify.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
      if (!explicitKey && !ctx.inFlow && str4.length > 1024) {
        if (simpleKeys)
          throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
        explicitKey = true;
      }
      if (ctx.inFlow) {
        if (allNullValues || value == null) {
          if (keyCommentDone && onComment)
            onComment();
          return str4 === "" ? "?" : explicitKey ? `? ${str4}` : str4;
        }
      } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
        str4 = `? ${str4}`;
        if (keyComment && !keyCommentDone) {
          str4 += stringifyComment.lineComment(str4, ctx.indent, commentString(keyComment));
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str4;
      }
      if (keyCommentDone)
        keyComment = null;
      if (explicitKey) {
        if (keyComment)
          str4 += stringifyComment.lineComment(str4, ctx.indent, commentString(keyComment));
        str4 = `? ${str4}
${indent}:`;
      } else {
        str4 = `${str4}:`;
        if (keyComment)
          str4 += stringifyComment.lineComment(str4, ctx.indent, commentString(keyComment));
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
        ctx.indentAtStart = str4.length + 1;
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
      str4 += ws + valueStr;
      if (ctx.inFlow) {
        if (valueCommentDone && onComment)
          onComment();
      } else if (valueComment && !valueCommentDone) {
        str4 += stringifyComment.lineComment(str4, ctx.indent, commentString(valueComment));
      } else if (chompKeep && onChompKeep) {
        onChompKeep();
      }
      return str4;
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
        let str5 = stringify.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
        if (comment2)
          str5 += stringifyComment.lineComment(str5, itemIndent, commentString(comment2));
        if (chompKeep && comment2)
          chompKeep = false;
        lines.push(blockItemPrefix + str5);
      }
      let str4;
      if (lines.length === 0) {
        str4 = flowChars.start + flowChars.end;
      } else {
        str4 = lines[0];
        for (let i = 1; i < lines.length; ++i) {
          const line = lines[i];
          str4 += line ? `
${indent}${line}` : "\n";
        }
      }
      if (comment) {
        str4 += "\n" + stringifyComment.indentComment(commentString(comment), indent);
        if (onComment)
          onComment();
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str4;
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
        let str4 = stringify.stringify(item, itemCtx, () => comment = null);
        reqNewline || (reqNewline = lines.length > linesAtValue || str4.includes("\n"));
        if (i < items.length - 1) {
          str4 += ",";
        } else if (ctx.options.trailingComma) {
          if (ctx.options.lineWidth > 0) {
            reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str4.length + 2) > ctx.options.lineWidth);
          }
          if (reqNewline) {
            str4 += ",";
          }
        }
        if (comment)
          str4 += stringifyComment.lineComment(str4, itemIndent, commentString(comment));
        lines.push(str4);
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
          let str4 = start;
          for (const line of lines)
            str4 += line ? `
${indentStep}${indent}${line}` : "\n";
          return `${str4}
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
      static from(schema, obj4, ctx) {
        const { keepUndefined, replacer } = ctx;
        const map = new this(schema);
        const add = (key, value) => {
          if (typeof replacer === "function")
            value = replacer.call(obj4, key, value);
          else if (Array.isArray(replacer) && !replacer.includes(key))
            return;
          if (value !== void 0 || keepUndefined)
            map.items.push(Pair.createPair(key, value, ctx));
        };
        if (obj4 instanceof Map) {
          for (const [key, value] of obj4)
            add(key, value);
        } else if (obj4 && typeof obj4 === "object") {
          for (const key of Object.keys(obj4))
            add(key, obj4[key]);
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
      createNode: (schema, obj4, ctx) => YAMLMap.YAMLMap.from(schema, obj4, ctx)
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
      static from(schema, obj4, ctx) {
        const { replacer } = ctx;
        const seq = new this(schema);
        if (obj4 && Symbol.iterator in Object(obj4)) {
          let i = 0;
          for (let it of obj4) {
            if (typeof replacer === "function") {
              const key = obj4 instanceof Set ? it : String(i++);
              it = replacer.call(obj4, key, it);
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
      createNode: (schema, obj4, ctx) => YAMLSeq.YAMLSeq.from(schema, obj4, ctx)
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
      resolve: (str4) => str4,
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
      resolve: (str4) => new Scalar.Scalar(str4[0] === "t" || str4[0] === "T"),
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
      const num2 = typeof value === "number" ? value : Number(value);
      if (!isFinite(num2))
        return isNaN(num2) ? ".nan" : num2 < 0 ? "-.inf" : ".inf";
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
      resolve: (str4) => str4.slice(-3).toLowerCase() === "nan" ? NaN : str4[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (str4) => parseFloat(str4),
      stringify(node) {
        const num2 = Number(node.value);
        return isFinite(num2) ? num2.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
      resolve(str4) {
        const node = new Scalar.Scalar(parseFloat(str4));
        const dot = str4.indexOf(".");
        if (dot !== -1 && str4[str4.length - 1] === "0")
          node.minFractionDigits = str4.length - dot - 1;
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
    var intResolve = (str4, offset2, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str4) : parseInt(str4.substring(offset2), radix);
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
      resolve: (str4, _onError, opt) => intResolve(str4, 2, 8, opt),
      stringify: (node) => intStringify(node, 8, "0o")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (str4, _onError, opt) => intResolve(str4, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x[0-9a-fA-F]+$/,
      resolve: (str4, _onError, opt) => intResolve(str4, 2, 16, opt),
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
        resolve: (str4) => str4,
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
        resolve: (str4) => str4 === "true",
        stringify: stringifyJSON
      },
      {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str4, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str4) : parseInt(str4, 10),
        stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
      },
      {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str4) => parseFloat(str4),
        stringify: stringifyJSON
      }
    ];
    var jsonError = {
      default: true,
      tag: "",
      test: /^/,
      resolve(str4, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str4)}`);
        return str4;
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
          const str4 = atob(src.replace(/[\n\r]/g, ""));
          const buffer = new Uint8Array(str4.length);
          for (let i = 0; i < str4.length; ++i)
            buffer[i] = str4.charCodeAt(i);
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
        let str4;
        if (typeof node_buffer.Buffer === "function") {
          str4 = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
        } else if (typeof btoa === "function") {
          let s = "";
          for (let i = 0; i < buf.length; ++i)
            s += String.fromCharCode(buf[i]);
          str4 = btoa(s);
        } else {
          throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
        }
        type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
        if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
          const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
          const n = Math.ceil(str4.length / lineWidth);
          const lines = new Array(n);
          for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
            lines[i] = str4.substr(o, lineWidth);
          }
          str4 = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
        }
        return stringifyString.stringifyString({ comment, type, value: str4 }, ctx, onComment, onChompKeep);
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
      resolve: (str4) => str4.slice(-3).toLowerCase() === "nan" ? NaN : str4[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: (str4) => parseFloat(str4.replace(/_/g, "")),
      stringify(node) {
        const num2 = Number(node.value);
        return isFinite(num2) ? num2.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
      resolve(str4) {
        const node = new Scalar.Scalar(parseFloat(str4.replace(/_/g, "")));
        const dot = str4.indexOf(".");
        if (dot !== -1) {
          const f = str4.substring(dot + 1).replace(/_/g, "");
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
    function intResolve(str4, offset2, radix, { intAsBigInt }) {
      const sign = str4[0];
      if (sign === "-" || sign === "+")
        offset2 += 1;
      str4 = str4.substring(offset2).replace(/_/g, "");
      if (intAsBigInt) {
        switch (radix) {
          case 2:
            str4 = `0b${str4}`;
            break;
          case 8:
            str4 = `0o${str4}`;
            break;
          case 16:
            str4 = `0x${str4}`;
            break;
        }
        const n2 = BigInt(str4);
        return sign === "-" ? BigInt(-1) * n2 : n2;
      }
      const n = parseInt(str4, radix);
      return sign === "-" ? -1 * n : n;
    }
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value)) {
        const str4 = value.toString(radix);
        return value < 0 ? "-" + prefix + str4.substr(1) : prefix + str4;
      }
      return stringifyNumber.stringifyNumber(node);
    }
    var intBin = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "BIN",
      test: /^[-+]?0b[0-1_]+$/,
      resolve: (str4, _onError, opt) => intResolve(str4, 2, 2, opt),
      stringify: (node) => intStringify(node, 2, "0b")
    };
    var intOct = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^[-+]?0[0-7_]+$/,
      resolve: (str4, _onError, opt) => intResolve(str4, 1, 8, opt),
      stringify: (node) => intStringify(node, 8, "0")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: (str4, _onError, opt) => intResolve(str4, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^[-+]?0x[0-9a-fA-F_]+$/,
      resolve: (str4, _onError, opt) => intResolve(str4, 2, 16, opt),
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
    function parseSexagesimal(str4, asBigInt) {
      const sign = str4[0];
      const parts = sign === "-" || sign === "+" ? str4.substring(1) : str4;
      const num2 = (n) => asBigInt ? BigInt(n) : Number(n);
      const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num2(60) + num2(p), num2(0));
      return sign === "-" ? num2(-1) * res : res;
    }
    function stringifySexagesimal(node) {
      let { value } = node;
      let num2 = (n) => n;
      if (typeof value === "bigint")
        num2 = (n) => BigInt(n);
      else if (isNaN(value) || !isFinite(value))
        return stringifyNumber.stringifyNumber(node);
      let sign = "";
      if (value < 0) {
        sign = "-";
        value *= num2(-1);
      }
      const _60 = num2(60);
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
      resolve: (str4, _onError, { intAsBigInt }) => parseSexagesimal(str4, intAsBigInt),
      stringify: stringifySexagesimal
    };
    var floatTime = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
      resolve: (str4) => parseSexagesimal(str4, false),
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
      resolve(str4) {
        const match = str4.match(timestamp.test);
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
      addIn(path24, value) {
        if (assertCollection(this.contents))
          this.contents.addIn(path24, value);
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
      deleteIn(path24) {
        if (Collection.isEmptyPath(path24)) {
          if (this.contents == null)
            return false;
          this.contents = null;
          return true;
        }
        return assertCollection(this.contents) ? this.contents.deleteIn(path24) : false;
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
      getIn(path24, keepScalar) {
        if (Collection.isEmptyPath(path24))
          return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
        return identity.isCollection(this.contents) ? this.contents.getIn(path24, keepScalar) : void 0;
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
      hasIn(path24) {
        if (Collection.isEmptyPath(path24))
          return this.contents !== void 0;
        return identity.isCollection(this.contents) ? this.contents.hasIn(path24) : false;
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
      setIn(path24, value) {
        if (Collection.isEmptyPath(path24)) {
          this.contents = value;
        } else if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, Array.from(path24), value);
        } else if (assertCollection(this.contents)) {
          this.contents.setIn(path24, value);
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
          for (const { count: count2, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count2);
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
        let count2 = 1;
        const end = error.linePos[1];
        if (end?.line === line && end.col > col) {
          count2 = Math.max(1, Math.min(end.col - col, 80 - ci));
        }
        const pointer = " ".repeat(ci) + "^".repeat(count2);
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
    function resolveProps(tokens5, { flow, indicator, next, offset: offset2, onError, parentIndent, startOnNewline }) {
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
      for (const token of tokens5) {
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
      const last = tokens5[tokens5.length - 1];
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
      const header2 = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
      if (!header2)
        return { value: "", type: null, comment: "", range: [start, start, start] };
      const type = header2.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
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
        const value2 = header2.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
        let end2 = start + header2.length;
        if (scalar.source)
          end2 += scalar.source.length;
        return { value: value2, type, comment: header2.comment, range: [start, end2, end2] };
      }
      let trimIndent = scalar.indent + header2.indent;
      let offset2 = scalar.offset + header2.length;
      let contentStart = 0;
      for (let i = 0; i < chompStart; ++i) {
        const [indent, content] = lines[i];
        if (content === "" || content === "\r") {
          if (header2.indent === 0 && indent.length > trimIndent)
            trimIndent = indent.length;
        } else {
          if (indent.length < trimIndent) {
            const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
            onError(offset2 + indent.length, "MISSING_CHAR", message);
          }
          if (header2.indent === 0)
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
          const src = header2.indent ? "explicit indentation indicator" : "first line";
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
      switch (header2.chomp) {
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
      const end = start + header2.length + scalar.source.length;
      return { value, type, comment: header2.comment, range: [start, end, end] };
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
      *compose(tokens5, forceDoc = false, endOffset = -1) {
        for (const token of tokens5)
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
          const head2 = source.substring(0, he);
          const body = source.substring(he + 1) + "\n";
          const props = [
            { type: "block-scalar-header", offset: offset2, indent, source: head2 }
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
            const header2 = token.props[0];
            if (header2.type !== "block-scalar-header")
              throw new Error("Invalid block scalar header");
            type = header2.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
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
      const head2 = source.substring(0, he);
      const body = source.substring(he + 1) + "\n";
      if (token.type === "block-scalar") {
        const header2 = token.props[0];
        if (header2.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        header2.source = head2;
        token.source = body;
      } else {
        const { offset: offset2 } = token;
        const indent = "indent" in token ? token.indent : -1;
        const props = [
          { type: "block-scalar-header", offset: offset2, indent, source: head2 }
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
    visit.itemAtPath = (cst, path24) => {
      let item = cst;
      for (const [field, index] of path24) {
        const tok = item?.[field];
        if (tok && "items" in tok) {
          item = tok.items[index];
        } else
          return void 0;
      }
      return item;
    };
    visit.parentCollection = (cst, path24) => {
      const parent = visit.itemAtPath(cst, path24.slice(0, -1));
      const field = path24[path24.length - 1][0];
      const coll = parent?.[field];
      if (coll && "items" in coll)
        return coll;
      throw new Error("Parent collection not found");
    };
    function _visit(path24, item, visitor) {
      let ctrl = visitor(item, path24);
      if (typeof ctrl === "symbol")
        return ctrl;
      for (const field of ["key", "value"]) {
        const token = item[field];
        if (token && "items" in token) {
          for (let i = 0; i < token.items.length; ++i) {
            const ci = _visit(Object.freeze(path24.concat([[field, i]])), token.items[i], visitor);
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
            ctrl = ctrl(item, path24);
        }
      }
      return typeof ctrl === "function" ? ctrl(item, path24) : ctrl;
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
    function includesToken(list3, type) {
      for (let i = 0; i < list3.length; ++i)
        if (list3[i].type === type)
          return true;
      return false;
    }
    function findNonEmptyIndex(list3) {
      for (let i = 0; i < list3.length; ++i) {
        switch (list3[i].type) {
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
import { readFileSync as readFileSync13 } from "node:fs";
import { parseArgs as parseArgs2 } from "node:util";

// src/version.ts
var VERSION = "0.1.0";

// src/cli/commands/classify.ts
import os4 from "node:os";

// src/classify/phases.ts
var PHASES = [
  { id: "writing-code", label: "Writing code" },
  { id: "writing-tests", label: "Writing tests" },
  { id: "lint", label: "Lint and format" },
  { id: "tests", label: "Running tests" },
  { id: "build", label: "Build" },
  { id: "rework", label: "Rework" },
  { id: "exploring", label: "Exploring" },
  { id: "running", label: "Running scripts" },
  { id: "planning", label: "Planning and answering" },
  { id: "waiting", label: "Waiting on you" },
  { id: "unclassified", label: "Unclassified" }
];
var PHASE_LABEL = Object.fromEntries(PHASES.map((p) => [p.id, p.label]));
function isCheckPhase(phase) {
  return phase === "lint" || phase === "tests" || phase === "build";
}
var RANK = {
  build: 11,
  tests: 10,
  lint: 9,
  rework: 8,
  "writing-tests": 7,
  "writing-code": 6,
  running: 5,
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
import path14 from "node:path";

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
        this.compactStart(e.t, e.trigger);
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
    this.dropLateCompactions();
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
  /**
   * Idle time between turns, with compactions you waited for (`/compact`) carved out of it. A
   * compaction while you're away stays in it.
   */
  addIdle(from, to) {
    let cursor = from;
    const cuts = this.compactions.filter(
      (c) => c.parentId === null && !c.flags.includes("background") && c.endMs > from && c.startMs < to
    ).sort((a, b) => a.startMs - b.startMs);
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
    this.openTurn(e.t, e.src ? ["notification"] : []);
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
    if (e.act) step.actions = e.act;
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
  /**
   * A compaction with no turn open that you didn't ask for is an idle compaction: Claude Code
   * compacts a session left idle before its prompt cache expires. It runs while you're away and
   * holds nothing up, so it's flagged background.
   */
  compactStart(t, trigger) {
    if (this.turn && this.main.modelStart !== null) {
      this.main.modelParts.push(this.modelStep(this.main, this.main.modelStart, t));
      this.main.modelStart = null;
    }
    this.compaction = this.newCompaction(t, !this.turn && trigger !== "manual");
  }
  newCompaction(t, idle) {
    const step = this.push({
      id: this.id("compact"),
      parentId: this.turn?.id ?? null,
      kind: "compact",
      startMs: t,
      endMs: t,
      flags: idle ? ["background"] : []
    });
    this.compactions.push(step);
    return step;
  }
  compactEnd(t) {
    const compaction = this.compaction;
    if (!compaction) return;
    compaction.endMs = t;
    this.compaction = null;
    if (this.turn && compaction.flags.includes("background") && this.turn.startMs < t) {
      compaction.endMs = Math.max(compaction.startMs, this.turn.startMs);
      this.newCompaction(compaction.endMs, false).endMs = t;
    }
    if (this.turn && this.main.open.size === 0) this.main.modelStart = t;
  }
  /**
   * Time after the last turn isn't part of the session, and neither is a compaction while you were
   * away then: it doesn't stretch the session.
   */
  dropLateCompactions() {
    const lastTurnEnd = this.lastTurnEnd;
    if (lastTurnEnd === null) return;
    const late = new Set(
      this.compactions.filter((c) => c.flags.includes("background") && c.startMs >= lastTurnEnd)
    );
    if (late.size === 0) return;
    const kept = this.steps.filter((s) => !late.has(s));
    this.steps.length = 0;
    this.steps.push(...kept);
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
function heredocTags(line, stack) {
  const tags = [];
  const top = () => stack[stack.length - 1] ?? "top";
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    const context = top();
    if (context === "sq") {
      if (c === "'") stack.pop();
      continue;
    }
    if (c === "\\") {
      i++;
      continue;
    }
    if (context === "dq") {
      if (c === '"') stack.pop();
      else if (c === "$" && line[i + 1] === "(") {
        stack.push(line[i + 2] === "(" ? "arith" : "cmd");
        i += line[i + 2] === "(" ? 2 : 1;
      }
      continue;
    }
    if (context === "arith") {
      if (c === ")" && line[i + 1] === ")") {
        stack.pop();
        i++;
      }
      continue;
    }
    if (c === "#" && (i === 0 || /[\s;&|(]/.test(line[i - 1] ?? ""))) break;
    if (c === "'") stack.push("sq");
    else if (c === '"') stack.push("dq");
    else if (c === "$" && line[i + 1] === "(") {
      stack.push(line[i + 2] === "(" ? "arith" : "cmd");
      i += line[i + 2] === "(" ? 2 : 1;
    } else if (c === "(") stack.push("paren");
    else if (c === ")" && (context === "cmd" || context === "paren")) stack.pop();
    else if (c === "<" && line[i + 1] === "<") {
      if (line[i + 2] === "<") {
        i += 2;
        continue;
      }
      const match = /^<<-?\s*(?:'([^']+)'|"([^"]+)"|\\?([A-Za-z_][A-Za-z0-9_]*))/.exec(
        line.slice(i)
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
function stripHeredocs(text) {
  if (!text.includes("<<")) return text;
  const lines = text.split("\n");
  const out = [];
  const stack = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    out.push(line);
    for (const tag of heredocTags(line, stack)) {
      while (i + 1 < lines.length && (lines[i + 1] ?? "").trim() !== tag) i++;
      if (i + 1 < lines.length) i++;
    }
  }
  return out.join("\n");
}
function substitutionsIn(text) {
  const subs = [];
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "\\") i++;
    else if (c === "$" && text[i + 1] === "(" && text[i + 2] !== "(") {
      const end = closingParen(text, i + 1);
      subs.push(text.slice(i + 2, end));
      i = end;
    } else if (c === "`") {
      const end = text.indexOf("`", i + 1);
      const stop = end === -1 ? text.length : end;
      subs.push(text.slice(i + 1, stop));
      i = stop;
    }
  }
  return subs;
}
function tokenize(text) {
  const tokens5 = [];
  let word = "";
  let quoted = false;
  let inWord = false;
  let subs = [];
  const flush = () => {
    if (inWord)
      tokens5.push({ kind: "word", value: word, quoted, ...subs.length ? { subs } : {} });
    word = "";
    quoted = false;
    inWord = false;
    subs = [];
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
      const inside = text.slice(i + 1, j);
      word += inside.replace(/\\(["\\$`])/g, "$1");
      subs.push(...substitutionsIn(inside));
      quoted = inWord = true;
      i = j;
      continue;
    }
    if (c === "$" && text[i + 1] === "(") {
      const end = closingParen(text, i + 1);
      word += text.slice(i, end + 1);
      if (text[i + 2] !== "(") subs.push(text.slice(i + 2, end));
      inWord = true;
      i = end;
      continue;
    }
    if (c === "$" && text[i + 1] === "{") {
      const end = closingBrace(text, i + 1);
      word += text.slice(i, end + 1);
      inWord = true;
      i = end;
      continue;
    }
    if (c === "`") {
      const end = text.indexOf("`", i + 1);
      const stop = end === -1 ? text.length : end;
      word += text.slice(i, stop + 1);
      subs.push(text.slice(i + 1, stop));
      inWord = true;
      i = stop;
      continue;
    }
    if ((c === "<" || c === ">") && text[i + 1] === "(") {
      const end = closingParen(text, i + 1);
      word += text.slice(i, end + 1);
      subs.push(text.slice(i + 2, end));
      inWord = true;
      i = end;
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
      tokens5.push({ kind: "redirect", value: fd + op + symbol });
      i = j + symbol.length - 1;
      continue;
    }
    const operator = OPERATORS.find((o) => text.startsWith(o, i));
    if (operator) {
      flush();
      tokens5.push({ kind: "op", value: operator });
      i += operator.length - 1;
      continue;
    }
    word += c;
    inWord = true;
  }
  flush();
  return tokens5;
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
function closingBrace(text, open) {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === "\\") i++;
    else if (c === "'") {
      const end = text.indexOf("'", i + 1);
      i = end === -1 ? text.length : end;
    } else if (c === '"') i = closingQuote(text, i);
    else if (c === "\n") return i - 1;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return i;
  }
  return text.length - 1;
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
var VAR_HEAD = /^\$(?:\{([A-Za-z_][A-Za-z0-9_]*)\}|([A-Za-z_][A-Za-z0-9_]*))$/;
var VAR_REF = /\$(?:\{([A-Za-z_][A-Za-z0-9_]*)\}|([A-Za-z_][A-Za-z0-9_]*))/g;
var DECLARES = /* @__PURE__ */ new Set(["export", "local", "declare", "typeset", "readonly"]);
function firstWord(words) {
  let i = 0;
  while (i < words.length && !words[i]?.quoted && LEADING_KEYWORDS.has(words[i]?.value ?? "")) i++;
  return i;
}
function expandVariables(words, scope) {
  let i = firstWord(words);
  const assignments = [];
  if (words[i]?.value && DECLARES.has(words[i]?.value) && !words[i]?.quoted) {
    assignments.push(...words.slice(i + 1).filter((w) => ASSIGNMENT.test(w.value)));
    i = words.length;
  }
  while (i < words.length && ASSIGNMENT.test(words[i]?.value ?? ""))
    assignments.push(words[i++]);
  if (i >= words.length) {
    for (const word of assignments) {
      const at = word.value.indexOf("=");
      const name = word.value.slice(0, at).replace(/\+$/, "");
      const value2 = word.value.slice(at + 1);
      if (word.subs?.length || /`|\$\(/.test(value2)) scope.vars.delete(name);
      else
        scope.vars.set(
          name,
          value2.replace(VAR_REF, (ref, a, b) => scope.vars.get(a ?? b) ?? ref)
        );
    }
    return words;
  }
  const head2 = words[i];
  const match = VAR_HEAD.exec(head2.value);
  const value = match ? scope.vars.get(match[1] ?? match[2]) : void 0;
  if (value === void 0 || !value.trim()) return words;
  const expanded = (head2.quoted ? [value] : value.split(/\s+/).filter(Boolean)).map((v) => ({
    value: v,
    quoted: true
  }));
  return [...words.slice(0, i), ...expanded, ...words.slice(i + 1)];
}
function splitCommand(text, depth = 0, scope = { functions: /* @__PURE__ */ new Set(), vars: /* @__PURE__ */ new Map() }) {
  const commands = [];
  let words = [];
  let writes = [];
  let piped = false;
  let redirect = null;
  const cd = [];
  const scopes = [];
  const functions = scope.functions;
  let caseDepth = 0;
  let inPattern = false;
  const end = (operator) => {
    const head2 = firstWord(words);
    if (words[head2]?.value === "function" && words[head2 + 1] && words[head2 + 2]?.value === "{") {
      functions.add(words[head2 + 1].value.replace(/\(\)$/, ""));
      words = words.slice(head2 + 3);
    }
    if (words[firstWord(words)]?.value === "function" && words[firstWord(words) + 1])
      functions.add(words[firstWord(words) + 1].value.replace(/\(\)$/, ""));
    words = expandVariables(words, scope);
    const argv = clean(words);
    if (depth < 4) {
      for (const sub of words.flatMap((w) => w.subs ?? [])) {
        for (const inner of splitCommand(sub, depth + 1, scope)) {
          commands.push({
            ...inner,
            cd: [...cd, ...inner.cd],
            substituted: true,
            piped: inner.piped
          });
        }
      }
    }
    if (argv.length > 0 && !functions.has(argv[0])) {
      const command = { argv, writes, cd: [...cd], piped };
      if (operator !== null) command.next = operator;
      if (scopes.length > 0) command.subshell = true;
      commands.push(command);
      if ((argv[0] === "cd" || argv[0] === "pushd") && !piped) cd.push(argv[1] ?? "~");
      else if (argv[0] === "popd" && cd.length > (scopes.at(-1) ?? 0)) cd.pop();
    } else if (operator !== "(" && operator !== ")") {
      const last = commands.at(-1);
      if (last?.next === ")") {
        if (operator === null) delete last.next;
        else last.next = operator;
      }
    }
    words = [];
    writes = [];
    piped = operator === "|" || operator === "|&";
    if (operator === "(") scopes.push(cd.length);
    else if (operator === ")" && scopes.length > 0) cd.length = scopes.pop();
  };
  const tokens5 = tokenize(stripHeredocs(text));
  for (let t = 0; t < tokens5.length; t++) {
    const token = tokens5[t];
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
    if (token.kind === "op" && token.value === "(" && words.length === firstWord(words) + 1 && tokens5[t + 1]?.kind === "op" && tokens5[t + 1]?.value === ")") {
      functions.add(words[words.length - 1]?.value);
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
    const last = words[words.length - 1];
    if (token.kind === "op" && token.value === "(" && last && !last.quoted && /^[A-Za-z_][A-Za-z0-9_]*\+?=$/.test(last.value)) {
      const subs = [...last.subs ?? []];
      for (let open = 1; t + 1 < tokens5.length && open > 0; ) {
        const inner = tokens5[++t];
        if (inner.kind === "op" && inner.value === "(") open++;
        else if (inner.kind === "op" && inner.value === ")") open--;
        else if (inner.kind === "word") subs.push(...inner.subs ?? []);
      }
      last.value += "(\u2026)";
      if (subs.length) last.subs = subs;
      continue;
    }
    if (token.kind === "op") {
      end(token.value);
      if (token.value === ";;" && caseDepth > 0) inPattern = true;
      continue;
    }
    words.push({
      value: token.value,
      quoted: token.quoted,
      ...token.subs ? { subs: token.subs } : {}
    });
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
  const head2 = at(start);
  if (head2 && !head2.quoted && SKIPPED_HEADS.has(head2.value)) return [];
  if (/^‹\d+$/.test(head2?.value ?? "") && /^lines?›$/.test(at(start + 1)?.value ?? "")) return [];
  while (start < words.length && (ASSIGNMENT.test(at(start)?.value ?? "") || at(start)?.value === "\u2039masked\u203A")) {
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
  corepack: {},
  "sandbox-exec": { valueOptions: ["-f", "-n", "-p", "-D"] },
  xcrun: { valueOptions: ["--sdk", "-sdk", "--toolchain", "-toolchain"] }
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
  pipx: { run: ["--spec", "--python", "--pip-args"] },
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
var SCOPED = {
  "@playwright/test": "playwright",
  "@angular/cli": "ng",
  "@biomejs/biome": "biome",
  "@tailwindcss/cli": "tailwindcss",
  "@vue/cli-service": "vue-cli-service",
  "@nestjs/cli": "nest",
  "@redocly/cli": "redocly",
  "@stoplight/spectral-cli": "spectral"
};
function programName(word) {
  const scoped = /^(@[\w.-]+\/[\w.-]+)(@[^\s/]+)?$/.exec(word);
  if (scoped?.[1]) return SCOPED[scoped[1]] ?? scoped[1].split("/")[1] ?? scoped[1];
  let name = word.replace(/\\/g, "/").split("/").pop() ?? word;
  name = name.replace(/\.(exe|cmd|bat)$/i, "");
  if (word.includes("/") && /@v?\d[\w.-]*$/.test(name)) name = name.replace(/@v?\d[\w.-]*$/, "");
  name = name.replace(/^([\w.-]+)(@[\w.^~<>=*-]+|==[\w.]+|\[[\w,-]+\])$/, "$1");
  if (name === "gradlew") return "gradle";
  if (name === "mvnw") return "mvn";
  return name;
}
var PYTHON_FLAGS = /* @__PURE__ */ new Set([
  "-u",
  "-B",
  "-I",
  "-E",
  "-O",
  "-OO",
  "-s",
  "-S",
  "-q",
  "-b",
  "-bb",
  "-d",
  "-R",
  "-P",
  "-v"
]);
var GO_TOOLS = /* @__PURE__ */ new Set([
  "addr2line",
  "asm",
  "buildid",
  "cgo",
  "compile",
  "covdata",
  "cover",
  "dist",
  "doc",
  "fix",
  "link",
  "nm",
  "objdump",
  "pack",
  "pprof",
  "preprofile",
  "test2json",
  "trace",
  "vet"
]);
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
    if (PYTHON.test(program)) {
      let i = 0;
      while (i < rest.length) {
        const flag = rest[i];
        if (PYTHON_FLAGS.has(flag)) i++;
        else if (flag === "-W" || flag === "-X") i += 2;
        else break;
      }
      if (rest[i] === "-m" && rest[i + 1]) {
        wrappers.push(`${program} -m`);
        argv = rest.slice(i + 1);
        continue;
      }
    }
    if (program === "coverage" && rest[0] === "run") {
      const valueOptions = [
        "--rcfile",
        "--source",
        "--omit",
        "--include",
        "--concurrency",
        "--data-file",
        "--context"
      ];
      let i = 1;
      while (i < rest.length && rest[i].startsWith("-") && rest[i] !== "-m")
        i += valueOptions.includes(rest[i]) ? 2 : 1;
      const after = rest[i] === "-m" ? rest.slice(i + 1) : rest.slice(i);
      if (after.length === 0) break;
      wrappers.push("coverage run");
      argv = rest[i] === "-m" ? after : ["python", ...after];
      continue;
    }
    if (program === "xcrun" && rest.some((a) => /^-(-?find|f|-show-.*|-sdk-.*|-version|v|h|-help)$/.test(a)))
      break;
    if ((program === "uv" || program === "dotnet") && rest[0] === "tool" && rest[1] === "run") {
      const after = skipOptions(rest.slice(2), ["--from", "--with", "--python", "-p"], false);
      if (after.length === 0) break;
      wrappers.push(`${program} tool run`);
      argv = after;
      continue;
    }
    if (program === "php" && /(^|\/)(vendor\/)?bin\/[\w.-]+$/.test(rest[0] ?? "")) {
      wrappers.push("php");
      argv = rest;
      continue;
    }
    if (program === "go" && rest[0] === "tool" && rest[1] && !GO_TOOLS.has(rest[1])) {
      wrappers.push("go tool");
      argv = rest.slice(1);
      continue;
    }
    if (program === "go" && rest[0] === "run" && /^[\w.-]+\.[a-z]+\/\S+@\S+$/.test(rest[1] ?? "")) {
      wrappers.push("go run");
      argv = rest.slice(1);
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
    if (/^[-+][a-zA-Z]*[oO]$/.test(arg)) {
      i++;
      continue;
    }
    if (!arg.startsWith("-") && !arg.startsWith("+")) return void 0;
  }
  return void 0;
}
function scriptFile(argv) {
  const first = argv[0] ?? "";
  if (SHELLS.has(programName(first))) {
    const file = argv.slice(1).find((a) => !a.startsWith("-"));
    return file && !shellString(argv) ? file : void 0;
  }
  return /^(\.{0,2}\/|[\w.-]+\/)[^\s]*\.(sh|bash|zsh)$/.test(first) || /^\.\/[\w./-]+$/.test(first) || /^(script|scripts|bin|tools|ci|\.github)\/[\w./-]+$/.test(first) ? first : void 0;
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
function findUp(start, names, files2) {
  let dir = path.resolve(start);
  for (let i = 0; i < 16; i++) {
    for (const name of names) {
      const file = path.join(dir, name);
      const text = files2.read(file);
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
function packageScripts(cwd, files2) {
  const found = findUp(cwd, ["package.json"], files2);
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
function resolveScript(runner, name, rest, cwd, files2, options) {
  if (options.workspace) return { kind: "script-name", runner, name, rest };
  const pkg = packageScripts(cwd, files2);
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
function resolveNpm(args, cwd, files2) {
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
    return resolveScript("npm", name, args.slice(i + 2 + j), dir, files2, {
      prePost: true,
      runsBins: false,
      workspace
    });
  }
  const alias = NPM_ALIASES[sub];
  if (alias)
    return resolveScript("npm", alias, args.slice(i + 1), dir, files2, {
      prePost: true,
      runsBins: false,
      workspace
    });
  return void 0;
}
function resolvePnpm(args, cwd, files2) {
  const dirOption = optionValue(args, ["-C", "--dir"]);
  const dir = dirOption ? resolvePath(cwd, dirOption) : cwd;
  const workspace = args.includes("-r") || args.includes("--recursive") || optionValue(args, ["--filter", "-F"]) !== void 0;
  const i = firstPositional(args, PNPM_VALUE_OPTIONS);
  if (i < 0) return void 0;
  const sub = args[i];
  if (sub === "run" || sub === "run-script") {
    const j = firstPositional(args.slice(i + 1), PNPM_VALUE_OPTIONS);
    if (j < 0) return void 0;
    return resolveScript("pnpm", args[i + 1 + j], args.slice(i + 2 + j), dir, files2, {
      prePost: false,
      runsBins: false,
      workspace
    });
  }
  if (sub === "test" || sub === "t")
    return resolveScript("pnpm", "test", args.slice(i + 1), dir, files2, {
      prePost: false,
      runsBins: false,
      workspace
    });
  if (PNPM_BUILTINS.has(sub)) return void 0;
  return resolveScript("pnpm", sub, args.slice(i + 1), dir, files2, {
    prePost: false,
    runsBins: true,
    workspace
  });
}
function resolveYarn(args, cwd, files2) {
  const cwdOption = optionValue(args, ["--cwd"]);
  const dir = cwdOption ? resolvePath(cwd, cwdOption) : cwd;
  const i = firstPositional(args, YARN_VALUE_OPTIONS);
  if (i < 0) return void 0;
  const sub = args[i];
  if (sub === "run") {
    const name = args[i + 1];
    return name ? resolveScript("yarn", name, args.slice(i + 2), dir, files2, {
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
  return resolveScript("yarn", sub, args.slice(i + 1), dir, files2, {
    prePost: true,
    runsBins: true,
    workspace: false
  });
}
function resolveBun(args, cwd, files2) {
  const i = firstPositional(args, ["--cwd"]);
  if (i < 0) return void 0;
  const sub = args[i];
  const after = sub === "run" ? firstPositional(args.slice(i + 1), ["--cwd", "--filter", "-F"]) : -1;
  const nameAt = sub === "run" ? after < 0 ? -1 : i + 1 + after : i;
  const name = nameAt >= 0 ? args[nameAt] : void 0;
  if (!name || sub !== "run" && BUN_BUILTINS.has(sub)) return void 0;
  if (/\.(m?[jt]sx?|cjs|cts)$/.test(name)) return void 0;
  const pkg = packageScripts(cwd, files2);
  if (pkg && typeof pkg.scripts[name] === "string") {
    return {
      kind: "script",
      runner: "bun",
      name,
      commands: scriptCommands(pkg.scripts, name, true),
      cwd: pkg.dir
    };
  }
  return sub === "run" ? { kind: "script-name", runner: "bun", name, rest: args.slice(nameAt + 1) } : void 0;
}
function resolveDeno(args, cwd, files2) {
  if (args[0] !== "task" || !args[1]) return void 0;
  const name = args[1];
  const found = findUp(cwd, ["deno.json", "deno.jsonc"], files2);
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
function resolveMake(args, cwd, files2) {
  if (args.some(
    (a) => [
      "-n",
      "--dry-run",
      "--just-print",
      "--recon",
      "-q",
      "--question",
      "-p",
      "--print-data-base",
      "-v",
      "--version",
      "-h",
      "--help"
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
  const text = fileOption ? files2.read(resolvePath(dir, fileOption)) : files2.read(path.join(dir, "GNUmakefile")) ?? files2.read(path.join(dir, "makefile")) ?? files2.read(path.join(dir, "Makefile"));
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
  "--include-build",
  "--configuration",
  "--dependency",
  "--task",
  "--tests",
  "--args"
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
  "-D"
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
  else if (program === "mvn") {
    tasks = positionals(args, MAVEN_VALUE_OPTIONS);
    if (args.some((a) => /^-D(skipTests|maven\.test\.skip)(=true)?$/.test(a)))
      tasks = tasks.map((t) => t === "verify" ? "package" : t);
  } else if (program === "lerna") {
    const all = positionals(args, ["--scope", "--ignore", "--concurrency", "--since"]);
    if (all[0] !== "run" || !all[1]) return void 0;
    tasks = [all[1]];
  } else if (program === "sbt") tasks = positionals(args, []).map((t) => t.replace(/^[^/]+\//, ""));
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
function resolveGitHook(args, cwd, files2) {
  const sub = positionals(args, ["-C", "-c", "--git-dir", "--work-tree", "--namespace"])[0];
  const hook = sub === "commit" ? "pre-commit" : sub === "push" ? "pre-push" : void 0;
  if (!hook || args.includes("--no-verify")) return void 0;
  if (hook === "pre-commit" && args.includes("-n")) return void 0;
  const root = findUp(cwd, [".git/HEAD", ".git"], files2)?.dir ?? cwd;
  const husky = files2.read(path.join(root, ".husky", hook));
  if (husky !== void 0)
    return { kind: "hook", name: `.husky/${hook}`, hook, commands: [husky], cwd: root };
  const lefthook = files2.read(path.join(root, "lefthook.yml")) ?? files2.read(path.join(root, "lefthook.yaml"));
  if (lefthook !== void 0) {
    try {
      const doc = import_yaml.default.parse(lefthook);
      const commands = Object.values(doc?.[hook]?.commands ?? {}).map((c) => c?.run).filter((c) => typeof c === "string");
      if (commands.length > 0)
        return { kind: "hook", name: `lefthook ${hook}`, hook, commands, cwd: root };
    } catch {
    }
  }
  if (hook === "pre-commit" && files2.read(path.join(root, ".pre-commit-config.yaml")) !== void 0) {
    return { kind: "hook", name: "pre-commit", hook, commands: ["pre-commit run"], cwd: root };
  }
  const gitHook = files2.read(path.join(root, ".git", "hooks", hook));
  if (gitHook !== void 0)
    return { kind: "hook", name: `.git/hooks/${hook}`, hook, commands: [gitHook], cwd: root };
  return void 0;
}
function resolve(argv, cwd, files2) {
  const program = programName(argv[0] ?? "");
  const args = argv.slice(1);
  switch (program) {
    case "npm":
      return resolveNpm(args, cwd, files2);
    case "pnpm":
      return resolvePnpm(args, cwd, files2);
    case "yarn":
      return resolveYarn(args, cwd, files2);
    case "bun":
      return resolveBun(args, cwd, files2);
    case "deno":
      return resolveDeno(args, cwd, files2);
    case "make":
    case "gmake":
      return resolveMake(args, cwd, files2);
    case "gradle":
    case "mvn":
    case "sbt":
    case "turbo":
    case "nx":
    case "lerna":
      return resolveTasks(program, args);
    case "git":
      return resolveGitHook(args, cwd, files2);
    case "fastlane":
      return resolveFastlane(args, cwd, files2);
  }
  const file = scriptFile(argv);
  if (file) {
    const full = resolvePath(cwd, file);
    const text = files2.read(full);
    if (text !== void 0 && isShellScript(file, text))
      return { kind: "file", file, commands: [text], cwd };
  }
  return void 0;
}
var FASTLANE_COMMANDS = /* @__PURE__ */ new Set([
  "run",
  "init",
  "lanes",
  "list",
  "docs",
  "env",
  "action",
  "actions",
  "new_action",
  "add_plugin",
  "install_plugins",
  "update_plugins",
  "new_plugin",
  "search_plugins",
  "enable_auto_complete",
  "update_fastlane",
  "help",
  "socket_server",
  "trigger",
  "spaceauth",
  "scan",
  "gym",
  "match",
  "snapshot",
  "frameit",
  "deliver",
  "pilot",
  "supply",
  "cert",
  "sigh",
  "pem",
  "produce",
  "precheck",
  "screengrab"
]);
var FASTLANE_PLATFORMS = /* @__PURE__ */ new Set(["ios", "android", "mac"]);
var FASTLANE_ACTIONS = {
  scan: "fastlane scan",
  run_tests: "fastlane scan",
  multi_scan: "fastlane scan",
  gym: "fastlane gym",
  build_app: "fastlane gym",
  build_ios_app: "fastlane gym",
  build_mac_app: "fastlane gym",
  xcodebuild: "xcodebuild build",
  xcbuild: "xcodebuild build",
  xctest: "xcodebuild test",
  swiftlint: "swiftlint",
  cocoapods: "pod install",
  carthage: "carthage bootstrap",
  spm: "swift build",
  // Uploads, signing and distribution: Running scripts, like `fastlane deliver`.
  upload_to_testflight: "fastlane pilot",
  pilot: "fastlane pilot",
  testflight: "fastlane pilot",
  deliver: "fastlane deliver",
  upload_to_app_store: "fastlane deliver",
  appstore: "fastlane deliver",
  supply: "fastlane supply",
  upload_to_play_store: "fastlane supply",
  match: "fastlane match",
  sync_code_signing: "fastlane match",
  firebase_app_distribution: "fastlane deliver",
  appcenter_upload: "fastlane deliver"
};
function parseFastfile(text) {
  const lanes = /* @__PURE__ */ new Map();
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const match = /^(\s*)(?:private_)?lane\s+:([A-Za-z_]\w*)\b.*\bdo\b/.exec(lines[i] ?? "");
    if (!match) continue;
    const indent = match[1].length;
    const body = [];
    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j] ?? "";
      const own = (/^\s*/.exec(line)?.[0] ?? "").length;
      if (line.trim() && own <= indent) break;
      body.push(line);
    }
    if (!lanes.has(match[2])) lanes.set(match[2], body.join("\n"));
  }
  return lanes;
}
var RUBY_STRING = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g;
function laneSteps(name, lanes, seen = /* @__PURE__ */ new Set()) {
  const out = { actions: [], shell: [] };
  const body = lanes.get(name);
  if (body === void 0 || seen.has(name)) return out;
  seen.add(name);
  const code = body.split("\n").filter((line) => !line.trim().startsWith("#")).join("\n");
  for (const m of code.matchAll(/\bsh\s*\(?\s*(?:command:\s*)?(["'])((?:\\.|(?!\1).)*)\1/g))
    out.shell.push(m[2].replace(/\\(["'\\])/g, "$1"));
  for (const m of code.matchAll(/\b(?:gradle|build_android_app)\s*\(([^)]*)\)/g)) {
    const task = /\btask:\s*["']([\w:-]+)["']/.exec(m[1])?.[1];
    if (task) out.actions.push(`gradle ${task}`);
  }
  const plain = code.replace(RUBY_STRING, '""');
  for (const m of plain.matchAll(
    /(?<![.:\w])([a-z_][a-z0-9_]*)(?=\s*\(|[ \t]+[a-z_]+:|[ \t]*$)/gm
  )) {
    const call = m[1];
    const command = FASTLANE_ACTIONS[call];
    if (command) out.actions.push(command);
    else if (lanes.has(call) && call !== name) {
      const inner = laneSteps(call, lanes, seen);
      out.actions.push(...inner.actions);
      out.shell.push(...inner.shell);
    }
  }
  return out;
}
function resolveFastlane(args, cwd, files2) {
  const words = positionals(args, ["--env"]).filter((w) => !w.includes(":"));
  let name = words[0];
  if (name && FASTLANE_PLATFORMS.has(name) && words[1]) name = words[1];
  if (!name || FASTLANE_COMMANDS.has(name)) return void 0;
  const found = findUp(cwd, ["fastlane/Fastfile", "Fastfile", ".fastlane/Fastfile"], files2);
  const lanes = found ? parseFastfile(found.text) : void 0;
  if (found && lanes?.has(name)) {
    const steps = laneSteps(name, lanes);
    const commands = steps.actions.length > 0 ? steps.actions : steps.shell;
    if (commands.length > 0) return { kind: "lane", name, commands, cwd: path.dirname(found.file) };
  }
  return { kind: "lane-name", name };
}
var SHELL_SHEBANG = /^#!\s*\S*\/(env\s+)?(sh|bash|zsh|dash|ksh)\b/;
function isShellScript(file, text) {
  if (text.startsWith("#!")) return SHELL_SHEBANG.test(text);
  return /\.(sh|bash|zsh)$/.test(file);
}

// src/classify/rules.ts
var import_yaml2 = __toESM(require_dist(), 1);
import path2 from "node:path";

// raw:src/classify/default-rules.yaml
var default_rules_default = "# awf phase rules. See docs/phases.md.\n#\n# A repo extends these in .awf/rules.yaml, in the same format. Its rules are tried first, so it can\n# also override these. Within a section the first matching rule wins: specific rules go first.\n#\n# Phases: lint, tests, build, exploring, writing (Writing code or Writing tests, by file), running\n# (Running scripts), planning, waiting, neutral (changes nothing and doesn't count, like cd or echo).\n\nversion: 1\n\n# Bash commands. A compound command (&&, ||, ;, |, newlines, subshells, sh -c) is split into simple\n# commands. Each one is matched after wrappers (env FOO=1, sudo, time, timeout, npx, pnpm exec,\n# uv run, poetry run, bundle exec, python -m, ...) are removed, and after npm/pnpm/yarn/bun scripts,\n# make targets, Gradle tasks, Maven goals and git commit hooks are resolved to what they run.\n#\n#   program   the command's name, without its path (string or list)\n#   args      leading arguments that must follow, in order, options skipped (\"a|b\" for either)\n#   with      arguments that must all appear anywhere (--flag also matches --flag=value)\n#   without   arguments that must not appear\n#   only      every argument must be one of these\n#   match     instead of program: a regex tested on the simple command\n#   tag       an extra tag on the step, like install\n#   tool      the check's name, when it isn't the program (go test is \"go test\")\ncommands:\n  # --version, --help and friends only read. For these programs -v and -V mean verbose.\n  - { phase: exploring, match: '^(?!(pytest|py\\.test|unittest|tox|nox|ctest|ninja|mypy|flake8|black|isort|pylint|behave|ansible-lint)\\s)\\S+\\s+(--version|-v|-V|--help|-h|version|help|-version|--usage)$' }\n\n  # Lint and format\n  - { phase: exploring, program: eslint, with: [--print-config] }\n  - phase: lint\n    program: [eslint, prettier, oxlint, standard, xo, stylelint, markdownlint, markdownlint-cli2, htmlhint, jsonlint, yamllint, hadolint, shellcheck, shfmt, actionlint, editorconfig-checker, eclint, lint-staged, commitlint, knip, depcheck, sort-package-json, syncpack, cspell, swift-format]\n  - { phase: lint, program: biome, args: ['check|lint|format|ci'] }\n  - { phase: lint, program: ruff, args: ['check|format'] }\n  - { phase: lint, program: [black, isort, flake8, pylint, mypy, pyright, basedpyright, pyflakes, pycodestyle, pydocstyle, bandit, autopep8, yapf, pyre, pytype, vulture] }\n  - { phase: lint, program: [golangci-lint, gofmt, goimports, gofumpt, staticcheck, revive, errcheck, govulncheck] }\n  - { phase: lint, program: go, args: ['vet|fmt'], tool: 'go {1}' }\n  - { phase: lint, program: [cargo, cross], args: ['clippy|fmt|check|audit|deny|udeps|machete|semver-checks|hack'], tool: 'cargo {1}' }\n  - { phase: lint, program: [rustfmt, clippy-driver] }\n  - { phase: lint, program: [ktlint, detekt, ktfmt, swiftlint, swiftformat, clang-format, clang-tidy, cpplint, cppcheck] }\n  - { phase: lint, program: swift, args: ['format'], tool: swift format }\n  - { phase: lint, program: dotnet, args: ['format'], tool: dotnet format }\n  - { phase: lint, program: [rubocop, standardrb, erb_lint, reek, brakeman] }\n  - { phase: lint, program: [phpcs, phpcbf, phpstan, psalm, php-cs-fixer, pint] }\n  - { phase: lint, program: [tsc, vue-tsc], with: [--noEmit], tool: tsc --noEmit }\n  - { phase: lint, program: [svelte-check, tflint, sqlfluff, checkov, ansible-lint, credo] }\n  - { phase: lint, program: buf, args: ['lint|format|breaking'] }\n  - { phase: lint, program: astro, args: ['check'] }\n  - { phase: lint, program: terraform, args: ['fmt|validate'] }\n  - { phase: lint, program: deno, args: ['lint|fmt|check'] }\n  - { phase: lint, program: [flutter, dart], args: ['analyze|format'] }\n  - { phase: lint, program: mix, args: ['format|credo|dialyzer'] }\n  - { phase: lint, program: pre-commit, args: ['run'] }\n  - { phase: lint, program: [ty, pyrefly], args: ['check'] }\n  - { phase: lint, program: [next, ng, vue-cli-service, expo], args: ['lint'] }\n  - { phase: lint, program: [nuxi, nuxt], args: ['typecheck'] }\n  - { phase: lint, program: xcodebuild, with: [analyze], tool: xcodebuild analyze }\n  - { phase: lint, match: '^(python\\S*\\s+)?(\\./)?manage\\.py\\s+check(\\s|$)', tool: django check }\n  - { phase: lint, match: '^(tox|nox)\\s(.*\\s)?(-e|-s|--session)\\s+\\S*(lint|mypy|typecheck|types|format|fmt|style|ruff|flake8|pylint|pre-commit)', tool: tox lint }\n\n  # Running tests (before Build, so a few build-like commands with test flags land here)\n  - { phase: exploring, program: [jest, vitest], with: [--listTests] }\n  - { phase: exploring, program: [pytest, py.test], with: [--collect-only] }\n  - { phase: exploring, program: [pytest, py.test], with: [--co] }\n  - { phase: exploring, program: go, args: [test], with: [-list] }\n  - { phase: exploring, program: cargo, args: ['nextest', 'list'] }\n  - { phase: exploring, program: cargo, args: [test], with: [--list] }\n  - { phase: exploring, program: [swift, dotnet], args: [test], with: [--list-tests] }\n  - { phase: build, program: go, args: [test], with: [-c], tool: go test -c }\n  - { phase: build, program: cargo, args: ['test|nextest'], with: [--no-run] }\n  - { phase: tests, program: [jest, vitest, mocha, ava, tap, jasmine, karma, uvu, cucumber-js, wdio, testcafe, nightwatch] }\n  - { phase: tests, program: playwright, args: ['test'] }\n  - { phase: tests, program: cypress, args: ['run'] }\n  - { phase: tests, program: [node, tsx], with: [--test] }\n  - { phase: tests, program: [bun, deno], args: ['test'] }\n  - { phase: tests, program: [pytest, py.test, tox, nox, nose2, ward, behave] }\n  - { phase: tests, program: unittest }\n  - { phase: tests, match: '^(python\\S*\\s+)?(\\./)?manage\\.py\\s+test(\\s|$)', tool: django test }\n  - { phase: tests, match: '^ruby\\s+(-I\\s*\\S+\\s+)*\\S*_test\\.rb', tool: minitest }\n  - { phase: tests, program: php, args: ['artisan', 'test'], tool: artisan test }\n  - { phase: tests, program: [ng, react-scripts, craco, vue-cli-service], args: ['test|test:*|e2e'] }\n  - { phase: tests, program: [hatch, rye, tuist], args: ['test'] }\n  - { phase: tests, program: fastlane, args: ['scan|test|tests'] }\n  - { phase: tests, program: go, args: [test], tool: go test }\n  - { phase: tests, program: [gotestsum, ginkgo] }\n  - { phase: tests, program: [cargo, cross], args: ['test|nextest|bench|miri|llvm-cov|tarpaulin|insta|mutants'], tool: cargo test }\n  - { phase: tests, program: cargo, args: ['xtask|make', 'test|tests|ci'], tool: cargo test }\n  - { phase: exploring, program: cargo, args: ['fuzz', 'list'] }\n  - { phase: build, program: cargo, args: ['fuzz', 'build|check'], tool: cargo fuzz build }\n  - { phase: writing, program: cargo, args: ['fuzz', 'init|add|new'] }\n  - { phase: tests, program: cargo, args: ['fuzz', 'run|coverage|cmin|tmin'], tool: cargo fuzz }\n  - { phase: tests, program: cargo-mutants, tool: cargo test }\n  - { phase: tests, program: dotnet, args: ['test|vstest'], tool: dotnet test }\n  - { phase: tests, program: dotnet, args: ['watch', 'test'], tool: dotnet test }\n  - { phase: tests, program: xcodebuild, with: [test], tool: xcodebuild test }\n  - { phase: tests, program: xcodebuild, with: [test-without-building], tool: xcodebuild test }\n  - { phase: tests, program: swift, args: [test], tool: swift test }\n  - { phase: tests, program: [bazel, bazelisk], args: [test], tool: bazel test }\n  - { phase: tests, program: [rspec, phpunit, pest, ctest, busted, prove] }\n  - { phase: tests, program: rails, args: ['test|test:*|spec|spec:*'] }\n  - { phase: tests, program: meson, args: [test] }\n  - { phase: tests, program: ninja, args: ['test|check'] }\n  - { phase: tests, match: '^cmake\\s.*--target\\s+(test|check|RUN_TESTS)(\\s|$)', tool: ctest }\n  - { phase: tests, program: mix, args: ['test'] }\n  - { phase: tests, program: [flutter, dart], args: ['test'] }\n  - { phase: tests, program: [k6, artillery], args: ['run'] }\n  # Watching CI waits for something outside the session, like an `until gh run view ...; do sleep\n  # 30; done` loop: Running scripts, polling. (Before the exploring gh rules below.)\n  - { phase: running, program: gh, args: ['run', 'watch'], tag: polling }\n  - { phase: running, program: gh, args: ['pr', 'checks'], with: [--watch], tag: polling }\n\n  # Build\n  - { phase: running, program: [webpack, rspack], args: ['serve|dev|watch'] }\n  - { phase: build, program: [tsc, vue-tsc, tsc-alias, tsup, unbuild, swc, babel, rollup, webpack, esbuild, parcel, rspack, rolldown, microbundle, ncc, pkg, electron-builder] }\n  - { phase: build, program: [vite, next, nuxt, astro, remix, svelte-kit, react-router, gatsby, ng, react-scripts, vue-cli-service, expo, storybook, craco], args: [build] }\n  - { phase: build, program: remix, args: ['vite:build'] }\n  - { phase: build, program: expo, args: ['export|prebuild'] }\n  - { phase: build, program: [gcc, g++, cc, c++, clang, clang++, rustc, javac, kotlinc, swiftc, scalac, zig, tinygo] }\n  - { phase: build, program: build, tool: python -m build }\n  - { phase: build, program: [uv, poetry, hatch, pdm, rye], args: [build] }\n  - { phase: build, program: maturin, args: ['build|develop'] }\n  - { phase: build, program: vite, args: ['optimize'] }\n  - { phase: build, program: go, args: ['build|install|generate'], tool: 'go {1}' }\n  - { phase: build, program: [cargo, cross], args: ['build|install|doc'], tool: 'cargo {1}' }\n  - { phase: build, program: cargo, args: ['clean'], tool: cargo clean }\n  - { phase: build, program: dotnet, args: ['build|publish|pack|msbuild'], tool: 'dotnet {1}' }\n  - { phase: build, program: [msbuild, MSBuild, xbuild] }\n  - { phase: build, program: xcodebuild, with: [-resolvePackageDependencies], tag: install, tool: install }\n  - { phase: build, program: xcodebuild, without: [-list, -showsdks, -version, -showBuildSettings, -showdestinations, -showTestPlans, -showBuildSettingsForIndex, -showComponent, -help, -usage, -license, -checkFirstLaunchStatus], tool: xcodebuild build }\n  - { phase: exploring, program: xcodebuild }\n  - { phase: build, program: swift, args: ['build'], tool: swift build }\n  - { phase: build, program: [bazel, bazelisk, buck, buck2, pants], args: ['build'], tool: bazel build }\n  - { phase: build, program: [cmake, ninja, meson, scons, xmake, premake5, autoreconf, configure] }\n  - { phase: build, program: [docker, podman], args: ['build'], tool: docker build }\n  - { phase: build, program: [docker, podman], args: ['buildx|compose|image', 'build'], tool: docker build }\n  - { phase: build, program: docker-compose, args: ['build'], tool: docker build }\n  - { phase: build, match: '^(docker\\s+compose|docker-compose)\\s(.*\\s)?up\\s(.*\\s)?--build', tool: docker build }\n  - { phase: build, program: [protoc, flatc, thrift, graphql-codegen, openapi-generator, openapi-generator-cli, sqlc, wire, mockgen, stringer] }\n  - { phase: build, program: buf, args: ['generate'] }\n  - { phase: build, program: prisma, args: ['generate'] }\n  - { phase: build, program: [dart, flutter], args: ['run|pub', 'build_runner'] }\n  - { phase: build, program: flutter, args: ['build|pub'] }\n  - { phase: build, program: dart, args: ['pub', 'get|upgrade|add|remove|downgrade'], tag: install, tool: install }\n  - { phase: build, program: mix, args: ['compile|deps.get|release'] }\n  - { phase: build, program: [pod, carthage], args: ['install|update|bootstrap'], tag: install }\n  - { phase: build, program: [tuist, xcodegen], args: ['generate|install|fetch|build'] }\n  - { phase: build, program: xcodegen, only: [] }\n  - { phase: build, program: fastlane, args: ['gym|build|build_app'] }\n  - { phase: build, program: deno, args: ['compile'] }\n  - { phase: exploring, match: '^lipo\\s(.*\\s)?-(info|archs|detailed_info|verify_arch)(\\s|$)' }\n  - { phase: build, program: lipo }\n  - { phase: build, program: bun, args: ['build'] }\n\n  # Installing dependencies counts as Build, tagged install\n  - { phase: build, program: [npm, pnpm, bun], args: ['install|i|ci|add|remove|rm|uninstall|update|up|upgrade|link|rebuild|prune|dedupe'], tag: install, tool: install }\n  - { phase: build, match: '^yarn(\\s+--?[a-z][a-z-]*)*$', tag: install, tool: install }\n  - { phase: build, program: yarn, args: ['install|add|remove|upgrade|up|dedupe'], tag: install, tool: install }\n  - { phase: build, program: [pip, pip3, pipx, uv, poetry, pipenv, pdm, conda, mamba, micromamba], args: ['install|sync|add|lock|update|uninstall|remove|venv|create'], tag: install, tool: install }\n  - { phase: build, program: uv, args: ['pip', 'install|sync|compile'], tag: install, tool: install }\n  - { phase: build, program: uv, args: ['tool', 'install|upgrade'], tag: install, tool: install }\n  - { phase: build, program: [conda, mamba, micromamba], args: ['env', 'create|update'], tag: install, tool: install }\n  - { phase: exploring, program: bundle, args: ['check|list|info|show|outdated|platform|doctor|config'] }\n  - { phase: exploring, program: gem, args: ['list|contents|which|info|search|environment|env|specification|query|outdated|dependency'] }\n  - { phase: build, program: [bundle, gem, composer], args: ['install|update|add|require|lock'], tag: install, tool: install }\n  - { phase: build, program: gem, args: ['build'] }\n  - { phase: build, program: [create-next-app, create-vite], tag: install, tool: install }\n  - { phase: exploring, match: '^xcode-select\\s+(-p|--print-path)$' }\n  - { phase: build, program: xcode-select, with: [--install], tag: install, tool: install }\n  - { phase: build, match: '^bundle(\\s+(--?[a-z][a-z-]*|\\d+))*$', tag: install, tool: install }\n  - { phase: build, program: swift, args: ['package', 'resolve|update'], tag: install, tool: install }\n  - { phase: exploring, program: go, args: ['mod', 'why|graph|verify'] }\n  - { phase: writing, program: go, args: ['mod', 'edit|init'] }\n  - { phase: build, program: go, args: ['mod', 'tidy|download|vendor'], tag: install, tool: install }\n  - { phase: build, program: go, args: ['get'], tag: install, tool: install }\n  - { phase: build, program: cargo, args: ['fetch|update|add|vendor'], tag: install, tool: install }\n  - { phase: writing, program: dotnet, args: ['add|remove', 'reference'] }\n  - { phase: build, program: dotnet, args: ['restore|add|tool'], tag: install, tool: install }\n  - { phase: build, program: [brew, apt, apt-get, dnf, yum, apk, port], args: ['install|upgrade|reinstall'], tag: install, tool: install }\n  - { phase: build, program: playwright, args: ['install'], tag: install, tool: install }\n  - { phase: build, program: [docker, podman], args: ['pull'], tag: install, tool: install }\n  - { phase: build, program: [docker, podman], args: ['compose', 'pull'], tag: install, tool: install }\n  - { phase: build, program: docker-compose, args: ['pull'], tag: install, tool: install }\n  - { phase: exploring, program: rustup, args: ['show|which|doc|check'] }\n  - { phase: exploring, match: '^rustup\\s+\\S+\\s+list(\\s|$)' }\n  - { phase: exploring, program: [nvm, fnm, pyenv, rbenv, asdf, mise, sdk, volta], args: ['ls|list|ls-remote|current|which|version|versions|list-remote'] }\n  - { phase: neutral, program: [nvm, fnm, pyenv, rbenv, asdf, mise, sdk], args: ['use|shell|local|global|deactivate|env|init'] }\n  - { phase: build, program: [rustup, nvm, fnm, volta, pyenv, rbenv, asdf, mise, sdk], args: ['install|add|toolchain|target|component'], tag: install, tool: install }\n\n  # Shell commands that only read\n  - phase: exploring\n    program: [ls, ll, la, lsd, eza, exa, tree, cat, bat, batcat, head, tail, less, more, grep, egrep, fgrep, rg, ag, ack, find, fd, fzf, wc, file, stat, du, df, which, whereis, type, pwd, realpath, readlink, basename, dirname, diff, colordiff, cmp, comm, jq, yq, gron, sort, uniq, cut, column, strings, xxd, hexdump, od, nl, tac, md5, md5sum, shasum, sha1sum, sha256sum, cksum, lsof, ps, pgrep, env, printenv, uname, sw_vers, whoami, id, hostname, date, man, tldr, history, tokei, cloc, scc, ldd, otool, nm, objdump, plutil, defaults, mdfind, xmllint, pdftotext, identify, exiftool, codesign, security, ioreg, system_profiler, vm_stat, sysctl, netstat, ifconfig, lsblk, free, top, htop, uptime, w, last, journalctl, dmesg, tput]\n  - { phase: exploring, program: [tr, base64, fold, paste, rev, iconv, expand, unexpand, fmt, seq, tsort, numfmt, look, uuidgen, swift-demangle, c++filt] }\n  - { phase: exploring, program: command, with: [-v] }\n  - { phase: exploring, program: [make, gmake], with: [-n] }\n  - { phase: exploring, match: '^(gcloud|aws|az|doctl|flyctl|heroku|vercel|netlify)\\s(\\S+\\s)*(list|describe|read|get|show|status|logs|print-access-token|print-identity-token|info|get-[a-z-]+|describe-[a-z-]+|list-[a-z-]+)(\\s|$)' }\n  - { phase: exploring, program: [sed, gsed, awk, gawk, nawk, mawk, perl] }\n  - phase: exploring\n    program: git\n    args: ['status|log|diff|show|blame|annotate|rev-parse|ls-files|ls-tree|ls-remote|grep|describe|shortlog|reflog|cat-file|whatchanged|range-diff|merge-base|name-rev|rev-list|count-objects|check-ignore|show-ref|for-each-ref|var|help|version|fetch|clone|merge-tree|cherry|archive|diff-tree|diff-index|diff-files|show-branch|verify-commit|verify-tag|check-attr|check-ref-format|fsck|hash-object']\n  - { phase: exploring, program: git, args: ['stash|worktree|submodule|notes', 'list|show|status'] }\n  - { phase: exploring, match: '^git config\\s(.*\\s)?(--get(-all|-regexp|-urlmatch|-color|colorbool)?|--list|-l)(\\s|$)' }\n  - { phase: exploring, match: '^git config(\\s+--(global|local|system|worktree|show-origin|show-scope|includes|null|name-only))*\\s+[A-Za-z][\\w-]*\\.[\\w.-]+$' }\n  - { phase: exploring, program: git, args: ['tag'], with: [-l] }\n  - { phase: exploring, match: '^git (branch|tag|remote)( -[a-zA-Z-]+)*$' }\n  - { phase: exploring, match: '^git (branch|tag)\\s(.*\\s)?--(list|contains|no-contains|merged|no-merged|sort|points-at|show-current|format)(\\s|=|$)' }\n  - { phase: exploring, program: git, args: ['remote', 'get-url|show'] }\n  - { phase: exploring, match: '^git symbolic-ref(\\s+(-q|--quiet|--short|--no-recurse))*\\s+\\S+$' }\n  - { phase: running, match: '^\\S*(gh|glab)\\s+api\\s(.*\\s)?(-X|--method)[\\s=]*(POST|PUT|PATCH|DELETE)\\b' }\n  - { phase: exploring, program: [gh, glab], args: ['pr|mr|issue|run|ci|pipeline|job|repo|release|workflow|search|api|gist|label|cache|variable', 'view|list|ls|diff|checks|status|watch|search|download|trace|get'] }\n  - { phase: exploring, program: [gh, glab], args: ['api'] }\n  - { phase: exploring, program: [gh, glab], args: ['auth', 'status|token'] }\n  - { phase: neutral, program: [gh, glab], args: ['auth', 'switch|login|logout|setup-git|refresh'] }\n  - { phase: exploring, program: [npm, pnpm, yarn, bun], args: ['ls|list|why|view|info|show|outdated|audit|explain|query|search|config|bin|root|prefix|pkg|licenses|doctor'] }\n  - { phase: exploring, program: uv, args: ['pip', 'list|show|freeze|tree|check'] }\n  - { phase: exploring, program: [pip, pip3, uv, poetry, conda], args: ['list|show|freeze|check|tree|info|search|env'] }\n  - { phase: exploring, program: swift, args: ['package', 'describe|dump-package|show-dependencies|show-executables|tools-version'] }\n  - { phase: exploring, program: go, args: ['list|env|doc|version|tool'] }\n  - { phase: exploring, program: cargo, args: ['tree|metadata|search|locate-project|pkgid|info'] }\n  - { phase: exploring, program: [docker, podman], args: ['ps|images|logs|inspect|stats|top|port|history|version|info|context'] }\n  - { phase: exploring, program: [docker, podman], args: ['compose', 'ps|logs|config|images|ls'] }\n  - { phase: exploring, program: docker-compose, args: ['ps|logs|config|images|ls|top|version'] }\n  - { phase: exploring, program: kubectl, args: ['get|describe|logs|top|explain|version|api-resources|config|auth|events'] }\n  - { phase: exploring, program: [simctl, devicectl], args: ['list'] }\n  - { phase: exploring, program: xcresulttool, args: ['get|export|metadata|graph|formatDescription'] }\n  - { phase: exploring, program: xcrun }\n  - { phase: exploring, program: [terraform, tofu], args: ['show|output|state|providers|version|graph'] }\n  - { phase: exploring, program: coverage, args: ['report|html|xml|json'] }\n  # Coverage reports read what a test run measured, like `coverage report` and xcresulttool. A\n  # coverage gate script is classified by what else it runs (see docs/phases.md).\n  - { phase: exploring, program: [llvm-cov, xccov, llvm-profdata], tag: coverage }\n  - { phase: exploring, program: [pdfinfo, pbpaste] }\n  - { phase: exploring, match: '^pmset\\s+-g' }\n  - { phase: exploring, match: '^tar\\s+-?[a-zA-Z]*t' }\n\n  # Shell commands that change files\n  - { phase: writing, program: [mkdir, touch, cp, mv, rm, rmdir, ln, chmod, chown, chgrp, truncate, tee, patch, install, rsync, scp, unzip, ditto] }\n  - { phase: writing, program: tar }\n  - phase: writing\n    program: git\n    args: ['add|commit|checkout|switch|restore|reset|stash|merge|rebase|cherry-pick|revert|mv|rm|tag|apply|am|init|clean|branch|worktree|submodule|notes|config|remote|pull|symbolic-ref|write-tree|commit-tree|update-ref|read-tree|update-index|mktree|replace']\n    tool: git\n\n  # Running scripts: running something that isn't a check, an edit or a read. Scripts and programs,\n  # the app and its servers, HTTP calls, databases, containers and clusters, deploys, publishing,\n  # pushes and CI actions. These come after the rules above, so `gh pr view` still explores and\n  # `docker build` still builds. Waiting in a loop counts here too (polling, decided in code).\n  - { phase: running, match: '^(\\S*/)?(python[23]?(\\.\\d+)?|pypy3?|py)(\\s|$)' }\n  - { phase: running, program: [node, nodejs, tsx, ts-node, ts-node-esm, vite-node, esno, bun, deno, ruby, php, java, kotlin, groovy, scala, jshell, swift, dotnet, Rscript, julia, lua, luajit, elixir, escript, electron] }\n  - { phase: running, program: [bash, sh, zsh, dash, ksh, fish, pwsh, powershell] }\n  - { phase: running, program: [go, cargo, mix], args: ['run|watch|phx.server|ecto.*'] }\n  - { phase: running, program: [vite, next, nuxt, nuxi, astro, remix, gatsby, react-scripts, vue-cli-service, ng, expo, storybook, react-native, flutter, tauri, wrangler], args: ['dev|develop|start|serve|preview|run|run-ios|run-android|run:ios|run:android|attach'] }\n  - { phase: running, program: vite }\n  - { phase: running, program: [nodemon, pm2, forever, serve, http-server, live-server, json-server, browser-sync, wait-on, http.server, uvicorn, gunicorn, hypercorn, daphne, flask, fastapi, streamlit, gradio, jupyter, ipython, celery, puma, rackup, foreman, overmind, air, ngrok, cloudflared, caddy, cloud-sql-proxy, mkcert] }\n  # Another agent run from the shell (claude -p) does work awf can't see into.\n  - { phase: running, program: claude }\n  - { phase: running, program: rails, args: ['server|s|console|c|runner|r|dbconsole|db|db:*'] }\n  - { phase: running, program: [curl, wget, http, https, xh, curlie, grpcurl, websocat, wscat, nc, ncat, netcat, telnet, ssh, mosh, ping, traceroute, mtr, dig, nslookup, host, whois, openssl] }\n  - { phase: running, program: [psql, pg_ctl, pg_dump, pg_dumpall, pg_restore, pg_isready, createdb, dropdb, createuser, dropuser, initdb, postgres, mysql, mysqldump, mysqladmin, mariadb, sqlite3, duckdb, redis-cli, redis-server, mongosh, mongo, mongod, mongodump, mongorestore, clickhouse, sqlcmd, cqlsh, alembic, flyway, liquibase, dbmate, goose, atlas] }\n  - { phase: running, program: [prisma, drizzle-kit], args: ['migrate|db|studio|push|up|seed'] }\n  - { phase: running, program: [docker, podman, docker-compose, nerdctl, colima, minikube, kind, k3d, kubectl, helm, skaffold, tilt, terraform, tofu, pulumi, ansible, ansible-playbook] }\n  - { phase: running, program: [gcloud, gsutil, bq, aws, az, doctl, flyctl, fly, heroku, vercel, netlify, firebase, wrangler, railway, supabase, eas, fastlane] }\n  - { phase: running, program: [simctl, devicectl, adb, emulator, ios-deploy, idb] }\n  - { phase: running, program: [npm, pnpm, yarn, bun], args: ['publish|unpublish|deprecate|dist-tag|login|logout|adduser'] }\n  - { phase: running, program: [cargo, poetry, uv, pdm, hatch, flit, gem], args: ['publish|push|yank|login|owner'] }\n  - { phase: running, program: twine }\n  - { phase: running, program: git, args: ['push'] }\n  - { phase: running, program: [gh, glab] }\n  - { phase: running, program: [playwright, lighthouse, ffmpeg, magick, sips, screencapture, pdftoppm, pmset] }\n  # A script file, or a program run by its path (./run, bin/dev, .build/release/app): the project's\n  # own scripts and binaries.\n  - { phase: running, match: '^\\S*\\.(sh|bash|zsh|py|js|mjs|cjs|ts|mts|cts|rb|pl|php|lua|swift|kts|exs|ps1|command)(\\s|$)' }\n  - { phase: running, match: '^\\S*/' }\n\n  # Changes nothing on its own, or takes no time worth a phase\n  - phase: neutral\n    program: [cd, pushd, popd, echo, printf, print, export, unset, set, source, '.', 'true', 'false', ':', sleep, wait, exit, return, read, alias, unalias, trap, shift, local, declare, typeset, readonly, ulimit, umask, '[', '[[', test, clear, reset, hash, shopt, setopt, bindkey, eval, let, break, continue, osascript, say, afplay, notify-send, terminal-notifier, open, xdg-open, kill, pkill, killall, disown, jobs, fg, bg, mktemp, pbcopy, xcode-select, caffeinate]\n\n# Gradle tasks, Maven goals and sbt tasks. turbo, nx, lerna and the other runners go by scripts:.\n# Tested against each task name, and against its last part for qualified names like :app:testDebug.\ntasks:\n  - { phase: exploring, match: '^(tasks|help|dependencies|dependencyInsight|properties|projects|buildEnvironment|outgoingVariants|resolvableConfigurations|javaToolchains|model|dependency:tree|dependency:list|help:effective-pom|versions:display-dependency-updates)$' }\n  - { phase: lint, match: '^(lint[A-Za-z]*|ktlint[A-Za-z]*|detekt[A-Za-z]*|spotless[A-Za-z]*|spotless:(check|apply)|checkstyle[A-Za-z]*|checkstyle:check|pmd[A-Za-z]*|pmd:check|spotbugs[A-Za-z]*|spotbugs:check|ktfmt[A-Za-z]*|format[A-Za-z]*|typecheck|type-check|tsc|check-types|checkTypes|prettier|eslint|fmt)$' }\n  - { phase: build, match: '^(build[A-Za-z]*|assemble[A-Za-z]*|bundle[A-Za-z]*|compile[A-Za-z]*|jar|bootJar|shadowJar|war|ear|dist[A-Za-z]*|install[A-Za-z]*|publish[A-Za-z]*|package|deploy|generate[A-Za-z]*|kapt[A-Za-z]*|ksp[A-Za-z]*|nativeCompile|clean|prepare|test-compile|process-resources|codegen|[a-z][A-Za-z]*Classes)$' }\n  - { phase: running, match: '^(run|bootRun|appRun|jettyRun|tomcatRun|runIde|quarkusDev|spring-boot:run|exec:java|exec:exec|jetty:run|quarkus:dev|liberty:dev)$' }\n  - { phase: tests, match: '^(test|tests|check|verify|connectedCheck|integration-test|e2e|spec|coverage|test[A-Z][A-Za-z0-9]*|test:.*|[a-z][A-Za-z0-9]*Tests?|connected[A-Za-z]*Test|(verify|record|validate)(Paparazzi|Roborazzi)[A-Za-z0-9]*|jacoco[A-Za-z]*|kover[A-Za-z]*|surefire:test|failsafe:integration-test|failsafe:verify)$' }\n\n# Names of npm/pnpm/yarn/bun scripts and make targets, used only when the file that defines them\n# can't be read. Steps decided this way are tagged by-name.\nscripts:\n  - { phase: lint, match: '^(lint|lint:.*|.*:lint|format|format:.*|fmt|prettier|eslint|typecheck|type-check|types|tsc|check-types|check:types|stylelint|biome|rubocop|ruff|black|mypy|pylint|flake8|clippy|style)$' }\n  - { phase: tests, match: '^(test|tests|test:.*|.*:test|spec|specs|e2e|e2e:.*|unit|integration|coverage|cy:run|vitest|jest|pytest|check|verify|validate|ci)$' }\n  - { phase: build, match: '^(build|build:.*|.*:build|compile|bundle|dist|prepare|prepack|package|generate|codegen|install|deps|all)$' }\n  - { phase: running, match: '^(dev|develop|start|serve|server|preview|watch|storybook|seed|migrate|db|deploy|release|publish|up|down|ios|android|web|tauri|electron)$' }\n\n# Tool calls other than Bash, by name: exact names, or a regex in match. action: the call's action\n# (\"a|b\" for either), like a browser computer call's screenshot. A batch's calls are matched one by\n# one, and the batch takes the highest-ranked phase, as a compound command does.\ntools:\n  - { phase: exploring, name: [Read, Grep, Glob, LS, WebSearch, WebFetch, NotebookRead, LSP, ToolSearch, Skill, ListMcpResourcesTool, ReadMcpResourceTool, ListAgents] }\n  - { phase: writing, name: [Edit, Write, MultiEdit, NotebookEdit] }\n  - { phase: planning, name: [TodoWrite, TodoRead, TaskCreate, TaskUpdate, TaskList, TaskGet, EnterPlanMode, ExitPlanMode, StructuredOutput, SubagentHandback, SendMessage, SendUserMessage, SendUserFile, Workflow] }\n  - { phase: planning, match: '^mcp__ccd_turn__' }\n  - { phase: waiting, name: [AskUserQuestion] }\n  - { phase: running, name: [Monitor] }\n  - { phase: lint, name: [mcp__ide__getDiagnostics] }\n  # Browsers (Claude in Chrome, the desktop app's built-in browser): looking at a page is Exploring,\n  # acting on it Running scripts. Waiting for the page doesn't count next to other calls.\n  - { phase: exploring, match: '^mcp__(.+__)?(claude-in-chrome|Claude_Browser)__(navigate|get_page_text|read_page|find|tabs_context|tabs_context_mcp|read_console_messages|read_network_requests|preview_logs|preview_list|list_connected_browsers|shortcuts_list)$' }\n  - { phase: exploring, match: '^mcp__(.+__)?(claude-in-chrome|Claude_Browser)__computer$', action: 'screenshot|zoom|scroll|scroll_to' }\n  - { phase: neutral, match: '^mcp__(.+__)?(claude-in-chrome|Claude_Browser)__computer$', action: wait }\n  - { phase: running, match: '^mcp__(.+__)?(claude-in-chrome|Claude_Browser)__' }\n  # Computer use: the same on the whole screen. Asking you for access to an app waits on you.\n  - { phase: waiting, name: [mcp__computer-use__request_access] }\n  - { phase: exploring, match: '^mcp__computer-use__(screenshot|zoom|scroll|cursor_position|list_granted_applications|read_clipboard)$' }\n  - { phase: neutral, name: [mcp__computer-use__wait] }\n  - { phase: running, match: '^mcp__computer-use__' }\n\n# Files whose edits count as Writing tests rather than Writing code.\ntestFiles:\n  - '**/*_test.go'\n  - '**/*.{test,spec}.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'\n  - '**/*.{test,spec}-d.ts'\n  - '**/__tests__/**'\n  - '**/__mocks__/**'\n  - '**/test_*.py'\n  - '**/*_test.py'\n  - '**/conftest.py'\n  - '**/src/test/**'\n  - '**/src/androidTest/**'\n  - '**/src/*Test/**'\n  - '**/*{Test,Tests,IT,Spec}.{java,kt,scala,groovy}'\n  - '**/Tests/**'\n  - '**/*Tests/**'\n  - '**/*{Test,Tests}.swift'\n  - '**/*.Tests/**'\n  - '**/*.UnitTests/**'\n  - '**/*{Test,Tests}.cs'\n  - '**/*_spec.rb'\n  - '**/*_test.rb'\n  - '**/test/**'\n  - '**/tests/**'\n  - '**/spec/**/*.{rb,js,jsx,ts,tsx,mjs,cjs,py,ex,exs,php}'\n  - '**/tests.py'\n  - '**/testdata/**'\n  - '**/*.cy.{js,jsx,ts,tsx}'\n  - '**/__snapshots__/**'\n  - '**/e2e/**'\n  - '**/*_test.{c,cc,cpp,rs,exs,dart}'\n  - '**/*.test.{c,cc,cpp}'\n\n# Failure patterns, matched against a check's output when the transcript has it, to catch failures\n# a pipe hid (pnpm test | tail). tool names a check (program or rule tool); * applies to every check.\nfailurePatterns:\n  - { tool: vitest, pattern: '(Test Files|Tests)\\s+(\\d+ failed|.*\\b\\d+ failed)' }\n  - { tool: jest, pattern: 'Tests:\\s+\\d+ failed' }\n  - { tool: mocha, pattern: '\\b\\d+ failing\\b' }\n  - { tool: node, pattern: '(?m)^(# fail [1-9]|\u2139 fail [1-9])' }\n  - { tool: bun, pattern: '(?m)^\\s*[1-9]\\d* fail\\b' }\n  - { tool: playwright, pattern: '(?m)^\\s+[1-9]\\d* failed' }\n  - { tool: pytest, pattern: '(?m)^(=+ .*\\b\\d+ (failed|error)|FAILED |ERROR \\S+(::|\\.py))' }\n  - { tool: tox, pattern: '(?m)evaluation failed|^ERROR:\\s+\\S+: (commands failed|exit \\d+)' }\n  - { tool: rspec, pattern: '\\d+ examples?, [1-9]\\d* failures?' }\n  - { tool: rails, pattern: '\\d+ runs, \\d+ assertions, ([1-9]\\d* failures|\\d+ failures, [1-9]\\d* errors)' }\n  - { tool: minitest, pattern: '\\d+ runs, \\d+ assertions, ([1-9]\\d* failures|\\d+ failures, [1-9]\\d* errors)' }\n  - { tool: phpunit, pattern: '(?m)^(FAILURES!|ERRORS!)' }\n  - { tool: ctest, pattern: 'tests failed out of' }\n  - { tool: go test, pattern: '(?m)^(FAIL|--- FAIL)\\b' }\n  - { tool: go build, pattern: '(?m)^\\S+\\.go:\\d+:\\d+: ' }\n  - { tool: go vet, pattern: '(?m)^\\S+\\.go:\\d+:\\d+: ' }\n  - { tool: cargo test, pattern: 'test result: FAILED' }\n  - { tool: cargo build, pattern: '(?m)^error(\\[E\\d{4}\\])?: ' }\n  - { tool: cargo check, pattern: '(?m)^error(\\[E\\d{4}\\])?: ' }\n  - { tool: cargo clippy, pattern: '(?m)^error(\\[|:)' }\n  - { tool: tsc, pattern: 'error TS\\d+' }\n  - { tool: tsc --noEmit, pattern: 'error TS\\d+' }\n  - { tool: eslint, pattern: '\\d+ problems? \\([1-9]\\d* errors?' }\n  - { tool: prettier, pattern: 'Code style issues found|\\[error\\]' }\n  - { tool: ruff, pattern: 'Found \\d+ errors?\\b(?! \\(\\d+ fixed, 0 remaining\\))|Would reformat' }\n  - { tool: mypy, pattern: 'Found \\d+ errors?' }\n  - { tool: pyright, pattern: '(?m)^\\s*[1-9]\\d* errors?, ' }\n  - { tool: golangci-lint, pattern: '(?m)^\\d+ issues?:' }\n  - { tool: rubocop, pattern: '[1-9]\\d* offenses? detected' }\n  - { tool: gradle, pattern: 'BUILD FAILED|FAILURE: Build failed' }\n  - { tool: mvn, pattern: 'BUILD FAILURE' }\n  - { tool: xcodebuild test, pattern: '\\*\\* TEST FAILED \\*\\*|Testing failed' }\n  - { tool: xcodebuild build, pattern: '\\*\\* BUILD FAILED \\*\\*' }\n  - { tool: dotnet build, pattern: 'Build FAILED|error [A-Z]{2,}\\d+' }\n  - { tool: dotnet test, pattern: 'Failed!\\s+-\\s+Failed:\\s+[1-9]' }\n  - { tool: swift test, pattern: '(?m)^(\\S+:\\d+:\\d+: )?error: |Test Suite .\\S+. failed|\u2718 Test run with .* failed' }\n  - { tool: '*', pattern: '(?m)ELIFECYCLE\\s+(Command|Test) failed|npm ERR! (code|Test failed)|npm error (code \\d|Lifecycle script)|error Command failed with exit code|ERR_PNPM_\\w+|^\\s*ERROR\\s+run failed|make(\\[\\d+\\])?: \\*\\*\\* \\[.*\\] Error \\d+|^FAILED\\b|BUILD FAILED|^error\\[' }\n";

// src/classify/rules.ts
var RULE_PHASES = /* @__PURE__ */ new Set([
  "lint",
  "tests",
  "build",
  "exploring",
  "writing",
  "running",
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
      if (source !== DEFAULT_RULES_SOURCE) rule.repo = true;
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
      if (r.action !== void 0)
        rule.actions = new Set(list(r.action).flatMap((a) => a.split("|")));
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
function findRulesFile(dir, files2) {
  let current = path2.resolve(dir);
  for (let i = 0; i < 12; i++) {
    const file = path2.join(current, ".awf", "rules.yaml");
    const text = files2.read(file);
    if (text !== void 0) return { file, text };
    const parent = path2.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return void 0;
}
function withDefaults(found) {
  return compileRules([
    { text: found.text, source: found.file },
    { text: default_rules_default, source: DEFAULT_RULES_SOURCE }
  ]);
}
function loadRules(cwd, files2) {
  const found = cwd ? findRulesFile(cwd, files2) : void 0;
  return found ? withDefaults(found) : defaultRules();
}
function repoRules(files2) {
  const byDir = /* @__PURE__ */ new Map();
  const byFile = /* @__PURE__ */ new Map();
  return (dir) => {
    const key = path2.resolve(dir);
    if (byDir.has(key)) return byDir.get(key);
    const found = findRulesFile(key, files2);
    let rules;
    if (found) {
      rules = byFile.get(found.file) ?? withDefaults(found);
      byFile.set(found.file, rules);
    }
    byDir.set(key, rules);
    return rules;
  };
}

// src/classify/classify.ts
var MAX_DEPTH = 4;
var COMPOUND_RANK = {
  build: 11,
  tests: 10,
  lint: 9,
  unclassified: 8,
  running: 7,
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
var DOCKER_OPTIONS = [
  "-H",
  "--host",
  "--context",
  "-c",
  "--config",
  "-l",
  "--log-level",
  "-f",
  "--file",
  "-p",
  "--project-name",
  "--profile",
  "--env-file",
  "--project-directory"
];
var VALUE_OPTIONS = {
  kubectl: [
    "-n",
    "--namespace",
    "--context",
    "--kubeconfig",
    "--cluster",
    "--user",
    "-s",
    "--server"
  ],
  gh: ["-R", "--repo"],
  docker: DOCKER_OPTIONS,
  podman: DOCKER_OPTIONS,
  "docker-compose": DOCKER_OPTIONS,
  bun: ["--cwd"],
  cargo: ["--color", "--config", "-Z", "-C"],
  cross: ["--color", "--config", "-Z"],
  ninja: ["-C", "-f", "-j", "-k", "-l", "-d", "-t", "-w"],
  meson: ["-C"],
  swift: ["--package-path", "--scratch-path", "-c", "--configuration"],
  terraform: ["-chdir"],
  dotnet: ["--project", "-p"],
  xcodebuild: [
    "-scheme",
    "-project",
    "-workspace",
    "-configuration",
    "-destination",
    "-sdk",
    "-target",
    "-derivedDataPath",
    "-resultBundlePath",
    "-testPlan",
    "-xcconfig",
    "-arch",
    "-toolchain",
    "-archivePath",
    "-exportPath",
    "-exportOptionsPlist",
    "-parallel-testing-worker-count"
  ],
  tox: ["-e", "-c", "--conf"],
  nox: ["-s", "--session", "-f", "--noxfile"]
};
function positionalArgs(program, args) {
  const valued = VALUE_OPTIONS[program] ?? [];
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (valued.includes(arg)) i++;
    else if (!arg.startsWith("-") && !arg.startsWith("+")) out.push(arg);
  }
  return out;
}
var TASK_RUNNERS = {
  just: { valueOptions: ["-f", "--justfile", "-d", "--working-directory", "--set"] },
  task: { valueOptions: ["-t", "--taskfile", "-d", "--dir"] },
  mise: { sub: ["run", "r"] },
  poe: {},
  devbox: { sub: ["run"] },
  composer: { valueOptions: ["-d", "--working-dir"] },
  rake: { valueOptions: ["-f", "--rakefile"] },
  invoke: {},
  inv: {}
};
var COMPOSER_COMMANDS = /* @__PURE__ */ new Set([
  "install",
  "i",
  "update",
  "u",
  "upgrade",
  "require",
  "r",
  "remove",
  "rm",
  "dump-autoload",
  "dumpautoload",
  "show",
  "info",
  "outdated",
  "validate",
  "diagnose",
  "config",
  "create-project",
  "init",
  "search",
  "depends",
  "why",
  "prohibits",
  "why-not",
  "audit",
  "global",
  "exec",
  "archive",
  "licenses",
  "status",
  "self-update",
  "clear-cache",
  "check-platform-reqs",
  "fund",
  "bump",
  "reinstall",
  "list",
  "help"
]);
var SCRIPT_RUNNERS = /* @__PURE__ */ new Set([
  "run-s",
  "run-p",
  "npm-run-all",
  "npm-run-all2",
  "concurrently",
  "start-server-and-test",
  "server-test",
  "start-test"
]);
function inPlaceEdit(program, args) {
  const positional = args.filter((a) => !a.startsWith("-"));
  if (program === "sed" || program === "gsed") {
    const inPlace = args.some((a) => /^-[a-zA-Z]*i/.test(a) || a.startsWith("--in-place"));
    if (!inPlace) return void 0;
    const script = args.some((a) => a === "-e" || a === "-f" || a === "--expression") ? 0 : 1;
    return positional.slice(script);
  }
  if (program === "perl") {
    const inPlace = args.some((a) => {
      if (!/^-[^-]/.test(a)) return false;
      for (const letter of a.slice(1)) {
        if (letter === "i") return true;
        if ("MmIdDxeEFlC0".includes(letter)) return false;
      }
      return false;
    });
    return inPlace ? positional.slice(1) : void 0;
  }
  if (program === "yq") {
    return args.some((a) => a === "-i" || a === "--inplace") ? positional.slice(1) : void 0;
  }
  if (program === "gawk" || program === "awk") {
    const i = args.indexOf("-i");
    return i >= 0 && args[i + 1] === "inplace" ? positional.slice(2) : void 0;
  }
  if (program === "sort") {
    const i = args.indexOf("-o");
    return i >= 0 && args[i + 1] ? [args[i + 1]] : void 0;
  }
  return void 0;
}
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
  constructor(rules, files2, rulesAt) {
    this.files = files2;
    this.rulesAt = rulesAt;
    this.rules = rules;
    this.sessionRules = rules;
  }
  files;
  rulesAt;
  /** The rules in effect: the session's, or the repo's a command runs in while it's classified. */
  rules;
  sessionRules;
  /** Rules of other repos the command being classified ran in. */
  visited = /* @__PURE__ */ new Set();
  /** Classifies one Bash command run in `cwd`. */
  command(text, cwd) {
    this.visited = /* @__PURE__ */ new Set();
    const info = this.within(cwd, () => {
      const parts = this.parts(text, cwd, 0);
      const combined = this.combine(parts, cwd);
      if (combined.checks.length > 0) combined.exit = exitTrust(splitCommand(text), parts);
      return combined;
    });
    if (this.visited.size > 0)
      info.failurePatterns = [...this.visited].flatMap((r) => r.failurePatterns);
    return info;
  }
  /** Runs `classify` with the rules of the repo `dir` is in. */
  within(dir, classify) {
    const rules = this.rulesAt?.(dir) ?? this.sessionRules;
    if (rules === this.rules) return classify();
    if (rules !== this.sessionRules) this.visited.add(rules);
    const outer = this.rules;
    this.rules = rules;
    try {
      return classify();
    } finally {
      this.rules = outer;
    }
  }
  isTestFile(file) {
    return matchesAny(file, this.rules.testFiles);
  }
  parts(text, cwd, depth) {
    const parts = [];
    const simples = splitCommand(text);
    simples.forEach((simple, index) => {
      if (simple.argv[0] === "cd") return;
      const where = simple.cd.reduce((dir, target) => resolvePath(dir, target), cwd);
      const made = this.within(where, () => this.simple(simple, where, depth));
      if (depth === 0) for (const part of made) part.index = index;
      parts.push(...made);
    });
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
        label: `${program} >`,
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
    const own = this.repoRule(argv);
    if (own) {
      out.push(this.byRule(own.argv, programName(own.argv[0] ?? ""), simple.piped, []));
      return out;
    }
    if (depth < MAX_DEPTH) {
      const expanded = this.expanded(argv, program, cwd, depth, simple.piped);
      if (expanded) return [...out, ...expanded];
      const resolved = this.resolved(argv, cwd, depth, simple.piped);
      if (resolved) return [...out, ...resolved];
    }
    out.push(this.byRule(argv, program, simple.piped, []));
    return out;
  }
  /**
   * A rule from the repo's `.awf/rules.yaml` matching this command, or the script file it runs
   * (`bash scripts/test.sh` is matched as `scripts/test.sh` too). Default rules never come first.
   */
  repoRule(argv) {
    const own = this.rules.commands.filter((r) => r.repo);
    if (own.length === 0) return void 0;
    const candidates = [argv];
    const file = scriptFile(argv);
    if (file && file !== argv[0]) candidates.push(argv.slice(argv.indexOf(file)));
    for (const candidate of candidates) {
      const program = programName(candidate[0] ?? "");
      const byPath = (candidate[0] ?? "").includes("/");
      if (own.some((r) => !(byPath && r.phase === "neutral") && ruleMatches(r, program, candidate)))
        return { argv: candidate };
    }
    return void 0;
  }
  /** The phase a script, target or task name suggests: its first word decides (build:test is a build). */
  byName(name) {
    const first = name.split(/[:_-]/)[0] ?? name;
    return this.rules.scripts.find((r) => r.match.test(first)) ?? this.rules.scripts.find((r) => r.match.test(name));
  }
  named(runner, name, piped, tag) {
    const rule = this.byName(name);
    if (!rule) return { ...this.unmatched(runner, piped), tags: [tag] };
    return this.part(rule.phase, runner, rule.id, piped, ["by-name", tag], `${runner} ${name}`);
  }
  /** Commands that run other commands awf can name: find -exec, task runners, script runners. */
  expanded(argv, program, cwd, depth, piped) {
    const args = argv.slice(1);
    if (program === "find" || program === "fd" || program === "fdfind") {
      const at = args.findIndex(
        (a) => ["-exec", "-execdir", "-ok", "-okdir", "-x", "--exec", "-X", "--exec-batch"].includes(a)
      );
      const parts = [];
      if (args.includes("-delete"))
        parts.push({ ...this.part("writing", program, "find-delete", piped, [], program) });
      if (at >= 0) {
        const rest = args.slice(at + 1);
        const stop = rest.findIndex((a) => a === ";" || a === "+");
        const inner = stop >= 0 ? rest.slice(0, stop) : rest;
        if (inner.length > 0)
          parts.push(...this.simple({ argv: inner, writes: [], cd: [], piped }, cwd, depth + 1));
      }
      if (parts.length === 0) return void 0;
      return [
        this.byRule(
          [argv[0], ...args.slice(0, at >= 0 ? at : args.length)],
          program,
          piped,
          []
        ),
        ...parts
      ];
    }
    const runner = TASK_RUNNERS[program];
    if (runner) {
      let rest = args;
      if (runner.sub) {
        const at = rest.findIndex((a) => !a.startsWith("-"));
        if (at < 0 || !runner.sub.includes(rest[at])) return void 0;
        rest = rest.slice(at + 1);
      }
      const names = positionals2(rest, runner.valueOptions ?? []).filter((n) => !n.includes("="));
      if (program === "composer") {
        if (["run", "run-script"].includes(names[0] ?? "")) names.shift();
        else if (COMPOSER_COMMANDS.has(names[0] ?? "")) return void 0;
      }
      const name = names[0];
      if (!name) return void 0;
      return [this.named(program, name, piped, `task:${name}`)];
    }
    if (SCRIPT_RUNNERS.has(program)) {
      const valueOptions = program === "concurrently" ? [
        "-n",
        "--names",
        "-c",
        "--prefix-colors",
        "-p",
        "--prefix",
        "-m",
        "--max-processes",
        "--success",
        "-t",
        "--timestamp-format",
        "--restart-tries",
        "--restart-after"
      ] : ["--max-parallel", "--npm-path"];
      let names = positionals2(args, valueOptions);
      if (program.includes("server") || program.endsWith("start-test")) names = names.slice(-1);
      if (names.length === 0) return void 0;
      const parts = names.flatMap((name) => {
        const shorthand = /^(npm|pnpm|yarn|bun):(.+)$/.exec(name);
        const command = program === "concurrently" && !shorthand ? name : `npm run ${shorthand?.[2] ?? name}`;
        return this.parts(command, cwd, depth + 1);
      });
      return parts.map((p) => ({
        ...p,
        piped: p.piped || piped,
        tags: unique([...p.tags, `via:${program}`])
      }));
    }
    return void 0;
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
        if (res.kind === "hook" && res.hook === "pre-push")
          parts.push(this.byRule(argv, program, piped, []));
        const tag = res.kind === "hook" ? `hook:${res.name}` : `file:${res.file}`;
        return tagged(parts.length > 0 ? parts : [this.unmatched(program, piped)], tag);
      }
      case "bin": {
        const parts = this.simple({ argv: res.argv, writes: [], cd: [], piped }, cwd, depth + 1);
        return tagged(parts, `via:${program}`);
      }
      case "script-name": {
        const rule = this.byName(res.name);
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
        const rule = this.byName(res.target);
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
      case "lane": {
        const parts = res.commands.flatMap((c) => this.parts(c, res.cwd, depth + 1));
        return tagged(
          parts.length > 0 ? parts : [this.unmatched(program, piped)],
          `lane:${res.name}`
        );
      }
      case "lane-name": {
        const rule = this.byName(res.name) ?? this.byName(res.name.split(/[:_-]/).pop() ?? "");
        if (!rule) return void 0;
        return [
          this.part(
            rule.phase,
            "fastlane",
            rule.id,
            piped,
            ["by-name", `lane:${res.name}`],
            `fastlane ${res.name}`
          )
        ];
      }
      case "tasks": {
        return res.tasks.map((task) => {
          if (["turbo", "nx", "lerna"].includes(res.runner))
            return this.named(
              res.runner,
              task.replace(/^[^:]+:(?=[^:]+:)/, ""),
              piped,
              `task:${task}`
            );
          const last = task.split(":").pop() ?? task;
          const rule = this.rules.tasks.find((r) => r.match.test(task) || r.match.test(last));
          if (!rule) return { ...this.unmatched(res.runner, piped), tags: [`task:${task}`] };
          return this.part(
            rule.phase,
            res.runner,
            rule.id,
            piped,
            [`task:${task}`],
            res.runner,
            `${res.runner} ${last}`
          );
        });
      }
    }
  }
  part(phase, program, rule, piped, tags, tool, label2 = tool) {
    const checks = isCheckPhase(phase) ? [{ key: `${phase}:${tool}`, phase, tool, failed: false }] : [];
    return { phase, program, tags, checks, rule, label: label2, files: [], piped };
  }
  unmatched(program, piped) {
    return {
      phase: void 0,
      program,
      tags: [],
      checks: [],
      rule: "none",
      label: program,
      files: [],
      piped
    };
  }
  byRule(argv, program, piped, tags) {
    const edited = inPlaceEdit(program, argv.slice(1));
    if (edited)
      return {
        ...this.part("writing", program, "in-place-edit", piped, tags, program, `${program} -i`),
        files: edited
      };
    const byPath = (argv[0] ?? "").includes("/");
    const rule = this.rules.commands.find(
      (r) => !(byPath && r.phase === "neutral") && ruleMatches(r, program, argv)
    );
    if (!rule) return { ...this.unmatched(program, piped), tags };
    const positional = positionalArgs(program, argv.slice(1));
    const tool = rule.tool?.replace("{1}", positional[0] ?? "") ?? program;
    const label2 = rule.tool ? tool : [program, ...positional.slice(0, rule.args?.length ?? 0), ...rule.with ?? []].join(" ");
    const part = this.part(
      rule.phase,
      program,
      rule.id,
      piped,
      rule.tag ? [rule.tag, ...tags] : tags,
      tool,
      label2
    );
    if (rule.phase === "writing" && WRITERS.has(program)) {
      part.files = argv.slice(1).filter((a) => !a.startsWith("-") && /[/.]/.test(a));
    }
    return part;
  }
  /**
   * Rule 2: a compound command takes its highest-ranked phase; the rest become tags. A script, or a
   * part no rule matches, ranks above Writing and Exploring: those commands take next to no time, so
   * it most likely took it. Waiting in a loop or a long sleep, with no check, is polling: Running
   * scripts.
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
    let primary = polling ? "running" : void 0;
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
      if (onlyNeutral) tags.add("neutral");
      const rule = onlyNeutral ? parts.find((p) => p.phase === "neutral")?.rule ?? "none" : "none";
      return { phase: "unclassified", tags: [...tags], checks: [...checks.values()], rule };
    }
    const decider = polling ? void 0 : counted[phases.indexOf(primary)];
    const decidedBy = polling ? "polling" : decider?.label;
    return {
      phase: primary,
      tags: [...tags],
      checks: [...checks.values()],
      rule: decider?.rule ?? (polling ? "polling" : "none"),
      ...decidedBy ? { decidedBy } : {}
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
        if (info.decidedBy) step.decidedBy = info.decidedBy;
        if (info.exit) step.exit = info.exit;
        if (step.kind === "tool") shellCwd.set(ctx, nextCwd(step.command, cwd, home));
        this.markFailures(step, info.failurePatterns);
      } else {
        this.tool(step, hasChildren);
      }
    }
    for (const step of ordered) {
      if (step.kind !== "tool" || !step.tool || !BACKGROUND_TOOLS.has(step.tool)) continue;
      if (!step.backgroundId) continue;
      const sources = steps.filter(
        (s) => s.backgroundId === step.backgroundId && s.phase && !(s.kind === "tool" && BACKGROUND_TOOLS.has(s.tool ?? ""))
      );
      const source = sources.find((s) => s.kind === "background") ?? sources[0];
      if (source?.phase && source.phase !== "unclassified") {
        step.phase = source.phase;
        step.tags = unique([...step.tags, "background-task"]);
      }
    }
    for (const step of steps) {
      if (step.kind === "model") step.phase = this.modelPhase(step, byId);
      else if (step.kind === "idle") step.phase = "waiting";
      else if (step.kind === "compact") {
        step.phase = step.flags.includes("background") ? "waiting" : "unclassified";
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
    const prefix = name.includes("__") ? name.slice(0, name.lastIndexOf("__") + 2) : "";
    const calls = step.actions?.length ? step.actions.map((entry) => {
      const colon = entry.indexOf(":");
      const tool = colon < 0 ? entry : entry.slice(0, colon);
      const action = colon < 0 ? void 0 : entry.slice(colon + 1);
      return { rule: this.toolRule(prefix + tool, action), wait: (action ?? tool) === "wait" };
    }) : [{ rule: this.toolRule(name), wait: name.slice(prefix.length) === "wait" }];
    const counted = calls.filter((c) => c.rule?.phase !== "neutral");
    if (counted.length === 0) {
      const waits = calls.every((c) => c.wait);
      step.phase = waits ? "running" : "unclassified";
      step.tags = [waits ? "polling" : "neutral"];
      if (calls[0]?.rule) step.rule = calls[0].rule.id;
      return;
    }
    const phases = counted.map(({ rule: rule2 }) => {
      if (!rule2) return "unclassified";
      if (rule2.phase !== "writing") return rule2.phase;
      return (step.files ?? []).some((f) => this.isTestFile(f)) ? "writing-tests" : "writing-code";
    });
    let best = 0;
    phases.forEach((phase, i) => {
      if (COMPOUND_RANK[phase] > COMPOUND_RANK[phases[best]]) best = i;
    });
    const primary = phases[best];
    const others = unique(phases.filter((p) => p !== primary && p !== "unclassified"));
    if (others.length > 0) step.tags = others;
    step.phase = primary;
    const rule = counted[best]?.rule;
    if (!rule) return;
    step.rule = rule.id;
    if (isCheckPhase(primary)) {
      step.checks = [{ key: `${primary}:${name}`, phase: primary, tool: name, failed: false }];
      this.markFailures(step);
    }
  }
  /** The first tool rule for a call. A rule with `action` matches only calls with one of those. */
  toolRule(name, action) {
    return this.rules.tools.find(
      (r) => (r.names?.has(name) || r.match?.test(name)) && (!r.actions || action !== void 0 && r.actions.has(action))
    );
  }
  /**
   * Rule 4: the exit code decides when it belongs to the checks. Output patterns decide when a pipe,
   * `;` or `|| true` hid it, or when a command chained after the checks may have failed instead.
   * A tool's own pattern names the check that failed.
   */
  markFailures(step, others = []) {
    if (step.checks.length === 0) return;
    const exit = step.exit ?? "full";
    const stopped = step.flags.includes("interrupted") || step.flags.includes("denied");
    const known = step.ok !== void 0 && !stopped;
    const passed = known && step.ok === true && exit !== "none";
    const output = step.detail?.output;
    const patterns = [...others, ...this.rules.failurePatterns];
    const byTool = (tool) => patterns.filter((p) => p.tool === tool);
    const named = output ? step.checks.filter((c) => byTool(c.tool).some((p) => p.pattern.test(output))) : [];
    const generic = output ? byTool("*").some((p) => p.pattern.test(output)) : false;
    const top = () => [...step.checks].sort((a, b) => RANK[b.phase] - RANK[a.phase])[0];
    const blame = (checks, sure) => {
      for (const check of checks) check.failed = true;
      if (!sure) step.tags = unique([...step.tags, "failure-unattributed"]);
    };
    if (passed) {
    } else if (named.length > 0) {
      blame(named, true);
    } else if (known && step.ok === false) {
      if (exit === "full") blame([top()], step.checks.length === 1);
      else if (!output || generic) blame([top()], false);
    } else if (generic) {
      blame([top()], step.checks.length === 1);
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
function exitTrust(simples, parts) {
  const withChecks = parts.filter((p) => p.checks.length > 0 && p.index !== void 0);
  if (withChecks.length === 0) return "full";
  const last = Math.max(...withChecks.map((p) => p.index));
  if (simples[last]?.substituted) return "none";
  const own = parts.filter((p) => p.index === last);
  const lastCheck = own.findLastIndex((p) => p.checks.length > 0);
  if (own.slice(lastCheck + 1).some((p) => p.piped)) return "none";
  let trust = "full";
  for (let k = last; k < simples.length; k++) {
    const op = simples[k]?.next;
    if (op === void 0) break;
    if (op === "(" || op === ")") continue;
    if (op === "|" || op === "|&") {
      if (k === last) return "none";
      trust = "pass";
      continue;
    }
    if (op === "&") return "none";
    if (k === simples.length - 1) break;
    if (op === "&&") {
      trust = "pass";
      continue;
    }
    return "none";
  }
  return trust;
}
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
    if (simple.subshell || simple.substituted) continue;
    if ((simple.argv[0] === "cd" || simple.argv[0] === "pushd") && !simple.piped)
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
    const positional = positionalArgs(program, args);
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
function positionals2(args, valueOptions) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--") break;
    if (valueOptions.includes(arg)) i++;
    else if (!arg.startsWith("-")) out.push(arg);
  }
  return out;
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
function cacheDir(env = process.env) {
  return path4.join(awfHome(env), "cache");
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
    const stat2 = statSync2(file);
    return {
      id: name.slice(0, -".jsonl".length),
      path: file,
      mtimeMs: stat2.mtimeMs,
      size: stat2.size
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
var IMPORT_VERSION = 5;
function cacheFile(id, env = process.env) {
  return path6.join(importedDir(env), `${safeId(id)}.json`);
}
function readImported(id, env = process.env) {
  const file = cacheFile(id, env);
  if (!existsSync3(file)) return void 0;
  try {
    const parsed = JSON.parse(readFileSync3(file, "utf8"));
    return [1, 2, 3, 4, IMPORT_VERSION].includes(parsed.version) && parsed.session ? parsed : void 0;
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
import { existsSync as existsSync8, readdirSync as readdirSync7, statSync as statSync5 } from "node:fs";
import path13 from "node:path";

// src/importers/agents.ts
import { existsSync as existsSync5, readdirSync as readdirSync4, readFileSync as readFileSync7, statSync as statSync3 } from "node:fs";
import os3 from "node:os";
import path10 from "node:path";

// src/importers/codex/import.ts
import { readFileSync as readFileSync4 } from "node:fs";
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
  // CLI flags that take a secret (a flag starts a word: `print-access-token` isn't `--token`)
  [
    /((?<![\w-])--?(?:password|passwd|pass|token|api-key|apikey|secret|access-key|secret-key|auth-token|client-secret)(?:=|\s+))("[^"]*"|'[^']*'|[^\s"']+)/gi,
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
    const tags = [
      ...line.matchAll(/(?<!<)<<(?!<)-?\s*(?:'([^']+)'|"([^"]+)"|\\?([A-Za-z_][A-Za-z0-9_]*))/g)
    ].map((m) => m[1] ?? m[2] ?? m[3]).filter((tag) => Boolean(tag));
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

// src/importers/common.ts
function obj(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function str(value) {
  return typeof value === "string" && value.length > 0 ? value : void 0;
}
function num(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
var MAX_OUTPUT = 4e3;
function clipOutput(text) {
  if (text.length <= MAX_OUTPUT) return text;
  const head2 = text.slice(0, 1500);
  const tail = text.slice(-2400);
  return `${head2}
\u2026 ${text.length - head2.length - tail.length} characters cut \u2026
${tail}`;
}
function oneLine(text) {
  const plain = maskSecrets(text.replace(/\s+/g, " ").trim());
  return plain.length > 160 ? plain.slice(0, 157) + "\u2026" : plain;
}
function commandFromArgv(argv) {
  if (typeof argv === "string") return argv;
  if (!Array.isArray(argv) || !argv.every((a) => typeof a === "string")) return void 0;
  const words = argv;
  if (words.length >= 3 && /^(ba|z|da|k)?sh$/.test(words[0]?.split("/").pop() ?? "")) {
    const flag = words[1] ?? "";
    if (/^-[a-z]*c[a-z]*$/.test(flag)) return words[2];
  }
  return words.map((w) => /^[\w@%+=:,./-]+$/.test(w) ? w : `'${w.replace(/'/g, `'\\''`)}'`).join(" ");
}
var SessionLog = class {
  constructor(id, agent, options) {
    this.id = id;
    this.agent = agent;
    this.options = options;
  }
  id;
  agent;
  options;
  events = [];
  details = /* @__PURE__ */ new Map();
  usages = [];
  turnOpen = false;
  lastMs = -Infinity;
  title;
  cwd;
  version;
  diagnostics = { unknownEntries: {}, badLines: 0, warnings: [] };
  emit(event) {
    this.events.push({ v: 1, sid: this.id, ...event });
    this.lastMs = Math.max(this.lastMs, event.t);
  }
  get latest() {
    return this.lastMs;
  }
  unknown(kind) {
    this.diagnostics.unknownEntries[kind] = (this.diagnostics.unknownEntries[kind] ?? 0) + 1;
  }
  /** You sent a prompt: the open turn ends where its last activity did, and a new one starts. */
  prompt(ms, text) {
    this.stop();
    this.turnOpen = true;
    this.emit({ e: "UserPromptSubmit", t: ms });
    if (this.options.detail && !this.title && text?.trim()) this.title = oneLine(text);
  }
  start(ms, call) {
    if (!this.turnOpen && !call.agentId) this.prompt(ms);
    const event = {
      e: "PreToolUse",
      t: ms,
      tool: call.tool,
      tuid: call.id
    };
    if (call.command) event.cmd = cleanCommand(call.command);
    if (call.files?.length) event.files = call.files;
    if (call.sub) event.sub = call.sub;
    if (call.agentId) event.aid = call.agentId;
    this.emit(event);
    if (this.options.detail && call.description)
      this.detail(call.id).description = oneLine(call.description);
  }
  end(ms, id, result2) {
    const event = {
      e: result2.ok ? "PostToolUse" : "PostToolUseFailure",
      t: ms,
      tuid: id,
      ok: result2.ok
    };
    if (result2.code !== void 0) event.code = result2.code;
    if (result2.durMs !== void 0) event.dur = Math.max(0, Math.round(result2.durMs));
    if (result2.interrupted) event.intr = true;
    if (result2.agentId) event.aid = result2.agentId;
    this.emit(event);
    if (this.options.detail && result2.output)
      this.detail(id).output = clipOutput(maskSecrets(result2.output));
  }
  subagentStart(ms, agentId, type) {
    this.emit({ e: "SubagentStart", t: ms, aid: agentId, ...type ? { at: type } : {} });
  }
  subagentStop(ms, agentId, type) {
    this.emit({ e: "SubagentStop", t: ms, aid: agentId, ...type ? { at: type } : {} });
  }
  /** Tokens of one model call, reported when it finished: the turn lasts at least until then. */
  usage(ms, tokens5, model, agentId) {
    this.usages.push({ ms, tokens: tokens5, ...model ? { model } : {}, ...agentId ? { agentId } : {} });
    if (!agentId) this.lastMs = Math.max(this.lastMs, ms);
  }
  /** The agent was still working at `ms` (a reply logged without a tool call). */
  active(ms) {
    this.lastMs = Math.max(this.lastMs, ms);
  }
  /** The turn ends: at `ms`, or at its last activity. */
  stop(ms) {
    if (!this.turnOpen) return;
    this.turnOpen = false;
    this.emit({ e: "Stop", t: Math.max(ms ?? this.lastMs, this.lastMs) });
  }
  detail(id) {
    let detail = this.details.get(id);
    if (!detail) this.details.set(id, detail = {});
    return detail;
  }
  build(file) {
    this.stop();
    const events = this.events.map((event, i) => ({ event, i })).sort((a, b) => a.event.t - b.event.t || a.i - b.i).map((x) => x.event);
    const session = eventsToSession(this.id, events);
    session.agent = this.agent;
    session.sources = ["transcript"];
    session.transcriptPath = file;
    if (this.cwd) session.cwd = this.cwd;
    if (this.version) session.agentVersion = this.version;
    if (this.title) session.title = this.title;
    session.diagnostics = this.diagnostics;
    const models = session.steps.filter((s) => s.kind === "model").sort((a, b) => a.endMs - b.endMs);
    for (const usage2 of this.usages) {
      const step = models.filter(
        (s) => !s.tokens && (s.agentId ?? "") === (usage2.agentId ?? "") && s.endMs <= usage2.ms + 1e3
      ).at(-1);
      if (!step) continue;
      step.tokens = usage2.tokens;
      if (usage2.model) step.model = usage2.model;
    }
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
};

// src/importers/codex/import.ts
var UUID = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
var INJECTED = /^\s*<(user_instructions|environment_context|user_shell_command|turn_aborted)>/;
function codexSessionId(file) {
  return UUID.exec(path7.basename(file))?.[1] ?? path7.basename(file, ".jsonl");
}
function parseArgs(text) {
  if (typeof text !== "string") return obj(text) ?? {};
  try {
    return obj(JSON.parse(text)) ?? {};
  } catch {
    return {};
  }
}
function patchFiles(patch) {
  const files2 = [];
  let adds = false;
  for (const match of patch.matchAll(/^\*\*\* (Update|Add|Delete) File: (.+)$/gm)) {
    if (match[1] === "Add") adds = true;
    if (match[2]) files2.push(match[2].trim());
  }
  return { files: files2, adds };
}
function toCall(id, name, args, cwd, input) {
  const inDir = (command, workdir) => workdir && cwd && path7.resolve(cwd, workdir) !== path7.resolve(cwd) ? `cd ${workdir} && ${command}` : command;
  switch (name) {
    case "shell":
    case "container.exec":
    case "local_shell": {
      const command = commandFromArgv(args.command);
      return {
        id,
        tool: "Bash",
        ...command ? { command: inDir(command, str(args.workdir)) } : {}
      };
    }
    case "exec_command": {
      const command = str(args.cmd) ?? commandFromArgv(args.command);
      return {
        id,
        tool: "Bash",
        ...command ? { command: inDir(command, str(args.workdir)) } : {}
      };
    }
    case "apply_patch": {
      const patch = input ?? str(args.input) ?? str(args.patch) ?? "";
      const { files: files2, adds } = patchFiles(patch);
      return {
        id,
        tool: adds && files2.length === 1 ? "Write" : "Edit",
        ...files2.length ? { files: files2 } : {}
      };
    }
    case "update_plan":
      return { id, tool: "TodoWrite" };
    case "view_image": {
      const file = str(args.path);
      return { id, tool: "Read", ...file ? { files: [file] } : {} };
    }
    default:
      return { id, tool: name.includes("__") ? `mcp__${name}` : name };
  }
}
function result(output) {
  let text = typeof output === "string" ? output : JSON.stringify(output ?? "");
  let code;
  let seconds;
  const parsed = typeof output === "string" && output.startsWith("{") ? parseArgs(output) : obj(output);
  if (parsed && ("output" in parsed || "metadata" in parsed)) {
    const meta = obj(parsed.metadata) ?? {};
    code = num(meta.exit_code);
    seconds = num(meta.duration_seconds);
    text = str(parsed.output) ?? "";
  } else {
    const exit = /^Exit code: (-?\d+)/m.exec(text);
    if (exit?.[1]) code = Number(exit[1]);
    const wall = /^Wall time: ([\d.]+) seconds/m.exec(text);
    if (wall?.[1]) seconds = Number(wall[1]);
  }
  const failedPatch = /^(apply_patch verification failed|Failed to apply patch|error:)/im.test(
    text
  );
  return {
    ok: code !== void 0 ? code === 0 : !failedPatch,
    ...code !== void 0 ? { code } : {},
    ...seconds !== void 0 ? { durMs: seconds * 1e3 } : {},
    text
  };
}
function tokens(usage2) {
  const input = num(usage2.input_tokens) ?? 0;
  const cached = num(usage2.cached_input_tokens) ?? 0;
  return {
    input: Math.max(0, input - cached),
    output: num(usage2.output_tokens) ?? 0,
    cacheRead: cached,
    cacheWrite: 0
  };
}
function importCodexRollout(file, options = {}) {
  const lines = readFileSync4(file, "utf8").split("\n");
  let id = codexSessionId(file);
  let log;
  const promptsFromEvents = lines.some((l) => l.includes('"type":"user_message"'));
  let model;
  let badLines = 0;
  const open = /* @__PURE__ */ new Set();
  for (const line of lines) {
    if (!line.trim()) continue;
    let entry;
    try {
      entry = obj(JSON.parse(line));
    } catch {
      badLines++;
      continue;
    }
    if (!entry) continue;
    const type = str(entry.type) ?? "";
    const payload = obj(entry.payload) ?? {};
    const ms = Date.parse(str(entry.timestamp) ?? "");
    if (type === "session_meta") {
      id = str(payload.id) ?? id;
      log ??= new SessionLog(id, "codex", options);
      log.cwd = str(payload.cwd) ?? log.cwd;
      log.version = str(payload.cli_version) ?? log.version;
      continue;
    }
    log ??= new SessionLog(id, "codex", options);
    if (!Number.isFinite(ms)) {
      log.unknown(`untimed:${str(entry.type) ?? "line"}`);
      continue;
    }
    if (type === "turn_context") {
      log.cwd ??= str(payload.cwd);
      model = str(payload.model) ?? model;
      continue;
    }
    if (type === "event_msg") {
      const kind = str(payload.type) ?? "";
      if (kind === "user_message") {
        const text = str(payload.message) ?? "";
        if (!INJECTED.test(text)) log.prompt(ms, text);
      } else if (kind === "token_count") {
        const usage2 = obj(obj(payload.info)?.last_token_usage);
        if (usage2) log.usage(ms, tokens(usage2), model);
      } else if (kind === "task_complete" || kind === "turn_complete") {
        log.stop(ms);
      } else if (kind === "turn_aborted") {
        for (const callId of open) log.end(ms, callId, { ok: false, interrupted: true });
        open.clear();
        log.stop(ms);
      } else if (![
        "agent_message",
        "agent_reasoning",
        "agent_reasoning_raw_content",
        "entered_review_mode",
        "exited_review_mode"
      ].includes(kind)) {
        log.unknown(`event_msg:${kind}`);
      }
      continue;
    }
    if (type !== "response_item") {
      if (type !== "compacted") log.unknown(type);
      continue;
    }
    const item = str(payload.type) ?? "";
    switch (item) {
      case "message": {
        if (str(payload.role) !== "user" || promptsFromEvents) break;
        const content = Array.isArray(payload.content) ? payload.content : [];
        const text = content.map((c) => str(obj(c)?.text) ?? "").join("\n");
        if (text && !INJECTED.test(text)) log.prompt(ms, text);
        break;
      }
      case "function_call":
      case "custom_tool_call": {
        const callId = str(payload.call_id) ?? str(payload.id);
        const name = str(payload.name) ?? "tool";
        if (!callId) break;
        const args = item === "function_call" ? parseArgs(payload.arguments) : {};
        log.start(ms, toCall(callId, name, args, log.cwd, str(payload.input)));
        open.add(callId);
        break;
      }
      case "local_shell_call": {
        const callId = str(payload.call_id) ?? str(payload.id);
        if (!callId) break;
        const action = obj(payload.action) ?? {};
        log.start(
          ms,
          toCall(
            callId,
            "local_shell",
            { command: action.command, workdir: action.working_directory },
            log.cwd
          )
        );
        open.add(callId);
        break;
      }
      case "function_call_output":
      case "custom_tool_call_output":
      case "local_shell_call_output": {
        const callId = str(payload.call_id);
        if (!callId || !open.has(callId)) break;
        open.delete(callId);
        const r = result(payload.output);
        log.end(ms, callId, {
          ok: r.ok,
          ...r.code !== void 0 ? { code: r.code } : {},
          ...r.durMs !== void 0 ? { durMs: r.durMs } : {},
          output: r.text
        });
        break;
      }
      case "web_search_call": {
        const callId = str(payload.id) ?? `search:${ms}`;
        log.start(ms, { id: callId, tool: "WebSearch" });
        log.end(ms, callId, { ok: str(payload.status) !== "failed" });
        break;
      }
      case "reasoning":
        break;
      default:
        log.unknown(`response_item:${item}`);
    }
  }
  log ??= new SessionLog(id, "codex", options);
  for (const callId of open) log.end(log.latest, callId, { ok: false, interrupted: true });
  log.diagnostics.badLines = badLines;
  return log.build(file);
}

// src/importers/gemini/import.ts
import { createHash } from "node:crypto";
import { readFileSync as readFileSync5 } from "node:fs";
import path8 from "node:path";
var FILE_ARGS = ["absolute_path", "file_path", "path", "dir_path", "directory"];
function files(args) {
  const out = FILE_ARGS.map((key) => str(args[key])).filter((f) => !!f);
  if (Array.isArray(args.paths)) {
    for (const p of args.paths) if (typeof p === "string") out.push(p);
  }
  return out;
}
function toCall2(id, name, args) {
  const withFiles = (tool) => {
    const list3 = files(args);
    return { id, tool, ...list3.length ? { files: list3 } : {} };
  };
  const description = str(args.description);
  switch (name) {
    case "run_shell_command": {
      const command = str(args.command);
      const dir = str(args.directory) ?? str(args.dir_path);
      return {
        id,
        tool: "Bash",
        ...command ? { command: dir ? `cd ${dir} && ${command}` : command } : {},
        ...description ? { description } : {}
      };
    }
    case "read_file":
    case "read_many_files":
      return withFiles("Read");
    case "write_file":
      return withFiles("Write");
    case "replace":
    case "edit":
      return withFiles("Edit");
    case "glob":
    case "list_directory":
      return { id, tool: "Glob" };
    case "search_file_content":
    case "grep":
      return { id, tool: "Grep" };
    case "web_fetch":
      return { id, tool: "WebFetch" };
    case "google_web_search":
      return { id, tool: "WebSearch" };
    case "write_todos":
      return { id, tool: "TodoWrite" };
    default:
      return { id, tool: name.includes("__") ? `mcp__${name}` : name };
  }
}
function outcome(call) {
  const parts = Array.isArray(call.result) ? call.result : [];
  let text = "";
  for (const part of parts) {
    const response = obj(obj(obj(part)?.functionResponse)?.response);
    const value = response?.output ?? response?.error ?? response?.content;
    if (typeof value === "string") text += value;
  }
  if (!text && typeof call.resultDisplay === "string") text = call.resultDisplay;
  const exit = /^Exit Code: (-?\d+)/m.exec(text);
  return { text, ...exit?.[1] ? { code: Number(exit[1]) } : {} };
}
function tokens2(usage2) {
  const input = num(usage2.input) ?? 0;
  const cached = num(usage2.cached) ?? 0;
  return {
    input: Math.max(0, input - cached),
    output: (num(usage2.output) ?? 0) + (num(usage2.thoughts) ?? 0),
    cacheRead: cached,
    cacheWrite: 0
  };
}
function projectFolder(hash, messages) {
  if (!hash) return void 0;
  const candidates = /* @__PURE__ */ new Set();
  for (const message of messages) {
    for (const call of Array.isArray(message.toolCalls) ? message.toolCalls : []) {
      for (const file of files(obj(obj(call)?.args) ?? {})) {
        if (!path8.isAbsolute(file)) continue;
        for (let dir = file; dir !== path8.dirname(dir); dir = path8.dirname(dir))
          candidates.add(dir);
      }
    }
  }
  for (const dir of candidates) {
    if (createHash("sha256").update(dir).digest("hex") === hash) return dir;
  }
  return void 0;
}
function geminiSessionId(file) {
  try {
    const head2 = readFileSync5(file, "utf8").slice(0, 600);
    const match = /"sessionId"\s*:\s*"([^"]+)"/.exec(head2);
    if (match?.[1]) return match[1];
  } catch {
  }
  return path8.basename(file, ".json");
}
function importGeminiChat(file, options = {}) {
  const chat = obj(JSON.parse(readFileSync5(file, "utf8"))) ?? {};
  const id = str(chat.sessionId) ?? path8.basename(file, ".json");
  const log = new SessionLog(id, "gemini", options);
  const messages = (Array.isArray(chat.messages) ? chat.messages : []).map((m) => obj(m) ?? {});
  const folder = projectFolder(str(chat.projectHash), messages);
  if (folder) log.cwd = folder;
  let counter = 0;
  for (const message of messages) {
    const ms = Date.parse(str(message.timestamp) ?? "");
    if (!Number.isFinite(ms)) {
      log.unknown("untimed message");
      continue;
    }
    const type = str(message.type) ?? "";
    if (type === "user") {
      const content = message.content;
      const text = typeof content === "string" ? content : JSON.stringify(content ?? "");
      log.prompt(ms, text);
      continue;
    }
    if (type !== "gemini") {
      if (!["info", "error", "warning"].includes(type)) log.unknown(`message:${type}`);
      continue;
    }
    const usage2 = obj(message.tokens);
    if (usage2) log.usage(ms, tokens2(usage2), str(message.model));
    log.active(ms);
    const calls = (Array.isArray(message.toolCalls) ? message.toolCalls : []).map(
      (c) => obj(c) ?? {}
    );
    for (const call of calls) {
      const callId = str(call.id) ?? `call:${++counter}`;
      const ended = Date.parse(str(call.timestamp) ?? "");
      const end = Number.isFinite(ended) ? Math.max(ms, ended) : ms;
      log.start(ms, toCall2(callId, str(call.name) ?? "tool", obj(call.args) ?? {}));
      const { text, code } = outcome(call);
      const status = str(call.status) ?? "";
      const ok = status === "success" && (code === void 0 || code === 0);
      log.end(end, callId, {
        ok,
        ...code !== void 0 ? { code } : {},
        ...status === "cancelled" ? { interrupted: true } : {},
        output: text
      });
    }
  }
  return log.build(file);
}

// src/importers/opencode/import.ts
import { existsSync as existsSync4, readdirSync as readdirSync3, readFileSync as readFileSync6 } from "node:fs";
import path9 from "node:path";
function readJson(file) {
  try {
    return obj(JSON.parse(readFileSync6(file, "utf8"))) ?? {};
  } catch {
    return {};
  }
}
function readDir(dir) {
  if (!existsSync4(dir)) return [];
  return readdirSync3(dir).filter((name) => name.endsWith(".json")).sort().map((name) => readJson(path9.join(dir, name)));
}
function storageRoot(sessionFile) {
  return path9.resolve(path9.dirname(sessionFile), "..", "..");
}
var time = (value, key) => num(obj(value)?.[key]);
function toCall3(id, tool, input, agentId) {
  const file = str(input.filePath) ?? str(input.file_path) ?? str(input.path);
  const base = { id, ...agentId ? { agentId } : {} };
  const description = str(input.description);
  switch (tool) {
    case "bash": {
      const command = str(input.command);
      return {
        ...base,
        tool: "Bash",
        ...command ? { command } : {},
        ...description ? { description } : {}
      };
    }
    case "read":
      return { ...base, tool: "Read", ...file ? { files: [file] } : {} };
    case "write":
      return { ...base, tool: "Write", ...file ? { files: [file] } : {} };
    case "edit":
    case "multiedit":
    case "patch":
      return { ...base, tool: "Edit", ...file ? { files: [file] } : {} };
    case "grep":
      return { ...base, tool: "Grep" };
    case "glob":
    case "list":
      return { ...base, tool: "Glob" };
    case "webfetch":
      return { ...base, tool: "WebFetch" };
    case "todowrite":
    case "todoread":
      return { ...base, tool: "TodoWrite" };
    case "task": {
      const sub = str(input.subagent_type);
      return {
        ...base,
        tool: "Agent",
        ...sub ? { sub } : {},
        ...description ? { description } : {}
      };
    }
    default:
      return {
        ...base,
        tool: tool.includes("_") && !tool.startsWith("mcp__") ? `mcp__${tool.replace("_", "__")}` : tool
      };
  }
}
function tokens3(usage2) {
  const cache = obj(usage2.cache) ?? {};
  return {
    input: num(usage2.input) ?? 0,
    output: (num(usage2.output) ?? 0) + (num(usage2.reasoning) ?? 0),
    cacheRead: num(cache.read) ?? 0,
    cacheWrite: num(cache.write) ?? 0
  };
}
function readSession(log, root, sessionId, agentId, seen) {
  if (seen.has(sessionId)) return;
  seen.add(sessionId);
  const messages = readDir(path9.join(root, "message", sessionId)).sort(
    (a, b) => (time(a.time, "created") ?? 0) - (time(b.time, "created") ?? 0)
  );
  for (const message of messages) {
    const messageId = str(message.id);
    const created = time(message.time, "created");
    if (!messageId || created === void 0) continue;
    const parts = readDir(path9.join(root, "part", messageId));
    if (str(message.role) === "user") {
      if (agentId) continue;
      const text = parts.map((p) => str(p.type) === "text" && !p.synthetic ? str(p.text) ?? "" : "").join("\n");
      log.prompt(created, text);
      continue;
    }
    const usage2 = obj(message.tokens);
    const completed = time(message.time, "completed");
    if (usage2) log.usage(completed ?? created, tokens3(usage2), str(message.modelID), agentId);
    for (const part of parts) {
      if (str(part.type) !== "tool") continue;
      const state = obj(part.state) ?? {};
      const callId = str(part.callID) ?? str(part.id);
      const start = time(state.time, "start");
      if (!callId || start === void 0) continue;
      const end = time(state.time, "end") ?? completed ?? start;
      const tool = str(part.tool) ?? "tool";
      const input = obj(state.input) ?? {};
      log.start(start, toCall3(callId, tool, input, agentId));
      const metadata = obj(state.metadata) ?? {};
      if (tool === "task") {
        const child = str(metadata.sessionId);
        if (child) {
          const type = str(input.subagent_type);
          log.subagentStart(start, child, type);
          readSession(log, root, child, child, seen);
          log.subagentStop(end, child, type);
        }
      }
      const status = str(state.status) ?? "";
      const exit = num(metadata.exit);
      const output = str(state.output) ?? str(state.error) ?? "";
      log.end(end, callId, {
        ok: status === "completed" && (exit === void 0 || exit === 0),
        ...exit !== void 0 ? { code: exit } : {},
        ...status === "error" && /abort|interrupt/i.test(str(state.error) ?? "") ? { interrupted: true } : {},
        ...agentId ? { agentId } : {},
        output
      });
    }
    if (!agentId && completed !== void 0 && str(message.finish) && str(message.finish) !== "tool-calls") {
      log.stop(completed);
    }
  }
}
function importOpenCodeSession(file, options = {}) {
  const info = readJson(file);
  const id = str(info.id) ?? path9.basename(file, ".json");
  const log = new SessionLog(id, "opencode", options);
  log.cwd = str(info.directory);
  log.version = str(info.version);
  if (options.detail && str(info.title)) log.title = str(info.title);
  readSession(log, storageRoot(file), id, void 0, /* @__PURE__ */ new Set());
  return log.build(file);
}

// src/importers/agents.ts
var AGENT_NAMES = {
  "claude-code": "Claude Code",
  codex: "Codex CLI",
  gemini: "Gemini CLI",
  opencode: "OpenCode"
};
function agentDirs(env = process.env) {
  const home = env.HOME || os3.homedir();
  return {
    codex: path10.join(env.CODEX_HOME || path10.join(home, ".codex"), "sessions"),
    gemini: path10.join(env.AWF_GEMINI_DIR || path10.join(home, ".gemini"), "tmp"),
    opencode: env.AWF_OPENCODE_STORAGE || path10.join(env.XDG_DATA_HOME || path10.join(home, ".local", "share"), "opencode", "storage")
  };
}
function stat(file) {
  try {
    const s = statSync3(file);
    return s.isFile() ? { mtimeMs: s.mtimeMs, size: s.size } : void 0;
  } catch {
    return void 0;
  }
}
function isDir(file) {
  try {
    return statSync3(file).isDirectory();
  } catch {
    return false;
  }
}
function list2(dir) {
  try {
    return readdirSync4(dir);
  } catch {
    return [];
  }
}
function listAgentSessions(env = process.env, sinceMs = -Infinity) {
  const dirs = agentDirs(env);
  const out = [];
  const add = (agent, file, id) => {
    const s = stat(file);
    if (s && s.mtimeMs >= sinceMs) out.push({ agent, id, path: file, ...s });
  };
  const walk = (dir, depth) => {
    for (const name of list2(dir)) {
      const full = path10.join(dir, name);
      if (/^rollout-.*\.jsonl$/.test(name)) add("codex", full, codexSessionId(full));
      else if (depth < 4 && isDir(full)) walk(full, depth + 1);
    }
  };
  if (existsSync5(dirs.codex)) walk(dirs.codex, 0);
  for (const project of list2(dirs.gemini)) {
    const chats = path10.join(dirs.gemini, project, "chats");
    for (const name of list2(chats)) {
      if (!/^session-.*\.json$/.test(name)) continue;
      const full = path10.join(chats, name);
      add("gemini", full, geminiSessionId(full));
    }
  }
  const sessions = path10.join(dirs.opencode, "session");
  for (const project of list2(sessions)) {
    for (const name of list2(path10.join(sessions, project))) {
      if (!name.endsWith(".json")) continue;
      const full = path10.join(sessions, project, name);
      if (isChildSession(full)) continue;
      add("opencode", full, name.slice(0, -".json".length));
    }
  }
  return out;
}
function isChildSession(file) {
  try {
    return /"parentID"\s*:\s*"/.test(readFileSync7(file, "utf8").slice(0, 2e3));
  } catch {
    return false;
  }
}
function detectAgentFile(file) {
  const s = stat(file);
  if (!s) return void 0;
  const full = path10.resolve(file);
  let head2;
  try {
    head2 = readFileSync7(full, "utf8").slice(0, 4e3);
  } catch {
    return void 0;
  }
  if (full.endsWith(".jsonl") && /"type"\s*:\s*"session_meta"/.test(head2.split("\n")[0] ?? ""))
    return { agent: "codex", id: codexSessionId(full), path: full, ...s };
  if (full.endsWith(".json") && /"sessionId"/.test(head2) && /"messages"/.test(head2))
    return { agent: "gemini", id: geminiSessionId(full), path: full, ...s };
  if (full.endsWith(".json") && /[/\\]storage[/\\]session[/\\]/.test(full))
    return { agent: "opencode", id: path10.basename(full, ".json"), path: full, ...s };
  return void 0;
}
function importAgentFile(file, options = {}) {
  switch (file.agent) {
    case "codex":
      return importCodexRollout(file.path, options);
    case "gemini":
      return importGeminiChat(file.path, options);
    case "opencode":
      return importOpenCodeSession(file.path, options);
  }
}

// src/importers/claude-code/import.ts
import { existsSync as existsSync6, readdirSync as readdirSync5, readFileSync as readFileSync8 } from "node:fs";
import path11 from "node:path";

// src/recorder/event.ts
function str2(value) {
  return typeof value === "string" && value.length > 0 ? value : void 0;
}
function obj2(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
var ACTION_NAME = /^[A-Za-z][\w.-]{0,63}$/;
var MAX_ACTIONS = 50;
function toolActions(tool, input) {
  if (!tool.startsWith("mcp__")) return void 0;
  const short = tool.slice(tool.lastIndexOf("__") + 2);
  const named = (name, action2) => {
    const n = str2(name);
    if (!n || !ACTION_NAME.test(n)) return void 0;
    const a = str2(action2);
    return a && ACTION_NAME.test(a) ? `${n}:${a}` : n;
  };
  if (short.endsWith("batch") && Array.isArray(input.actions)) {
    const out = [];
    for (const item of input.actions.slice(0, MAX_ACTIONS)) {
      const call = obj2(item);
      if (!call) continue;
      const action2 = call.name !== void 0 ? named(call.name, obj2(call.input)?.action) : named(call.action, void 0);
      if (action2) out.push(action2);
    }
    return out.length > 0 ? out : void 0;
  }
  const action = named(short, input.action);
  return action?.includes(":") ? [action] : void 0;
}

// src/importers/claude-code/format.ts
var READ_TYPES = /* @__PURE__ */ new Set([
  "user",
  "assistant",
  "system",
  "queue-operation",
  "attachment",
  "api-request"
]);
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
function str3(value) {
  return typeof value === "string" && value.length > 0 ? value : void 0;
}
function obj3(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : void 0;
}
function timestampMs(entry) {
  const raw = str3(entry.timestamp);
  if (!raw) return void 0;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : void 0;
}
function contentBlocks(entry) {
  const content = obj3(entry.message)?.content;
  return Array.isArray(content) ? content.filter((b) => !!obj3(b)) : [];
}
function messageText(entry) {
  const content = obj3(entry.message)?.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((b) => obj3(b)?.type === "text" ? String(obj3(b)?.text ?? "") : "").filter(Boolean).join("\n");
}
function resultText(block) {
  const content = block.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((b) => obj3(b)?.type === "text" ? String(obj3(b)?.text ?? "") : "").filter(Boolean).join("\n");
}
function promptKind(entry) {
  if (entry.isCompactSummary === true || entry.isVisibleInTranscriptOnly === true) return "none";
  if (contentBlocks(entry).some((b) => b.type === "tool_result")) return "none";
  const text = messageText(entry).trimStart();
  if (text.startsWith("[Request interrupted")) return "none";
  const origin = str3(obj3(entry.origin)?.kind);
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
var STOP_TOOLS = /* @__PURE__ */ new Set(["TaskStop", "KillShell", "KillBash"]);
var TASK_REFS = /* @__PURE__ */ new Set([...STOP_TOOLS, "TaskOutput", "BashOutput"]);
var MAX_OUTPUT2 = 4e3;
var MONITOR_TIMEOUT_MS = 3e5;
var MONITOR_MAX_TIMEOUT_MS = 18e5;
var MONITOR_STARTED = /^Monitor started \(task ([\w-]+)/;
var SHELL_STARTED = /^Command running in background with ID: ([\w-]+)/;
function importClaudeCodeTranscript(file, options = {}) {
  const sessionId = path11.basename(file, ".jsonl");
  const reader = new TranscriptReader(options);
  reader.readMain(readLines(file));
  const subDir = path11.join(path11.dirname(file), sessionId, "subagents");
  if (existsSync6(subDir)) {
    for (const name of readdirSync5(subDir).sort()) {
      const match = /^agent-(.+)\.jsonl$/.exec(name);
      if (match?.[1]) reader.readSubagent(match[1], readLines(path11.join(subDir, name)));
    }
  }
  return reader.build(sessionId, file);
}
function readLines(file) {
  return readFileSync8(file, "utf8").split("\n");
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
  /** When each model request was sent (`api-request` entries), by request ID. */
  requests = /* @__PURE__ */ new Map();
  /** Requests each agent ('' for the main one) sent since its last input, not yet answered. */
  sends = /* @__PURE__ */ new Map();
  /** Monitor calls by tool_use_id: how long each may run before Claude Code kills it. */
  monitors = /* @__PURE__ */ new Map();
  /** The latest timestamp in the transcripts: Claude Code was still running then. */
  lastMs = -Infinity;
  turnOpen = false;
  turnStart = 0;
  lastActivity = 0;
  turnEndMark;
  /** A message after the turn ended that wasn't a prompt (an app notice, a `!` command). */
  pendingPrompt;
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
        if (obj3(entry)) entries2.push(entry);
        else this.diagnostics.badLines++;
      } catch {
        this.diagnostics.badLines++;
      }
    }
    return entries2;
  }
  /** Checks an entry's type, notes its version and cwd; returns false for entries to skip. */
  accept(entry) {
    const type = str3(entry.type) ?? "<no type>";
    const version = str3(entry.version);
    if (version && (!this.version || compareVersions(version, this.version) > 0))
      this.version = version;
    if (!this.cwd && str3(entry.cwd)) this.cwd = str3(entry.cwd);
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
      this.lastMs = Math.max(this.lastMs, ms);
      const agentId = entry.isSidechain === true ? str3(entry.agentId) ?? "sidechain" : void 0;
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
        case "api-request":
          this.request(entry, ms, agentId);
          break;
        case "queue-operation":
        case "attachment": {
          const text = entry.type === "attachment" ? JSON.stringify(entry.attachment ?? "") : str3(entry.content) ?? "";
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
    const at = this.agentTypes.get(agentId) ?? str3(first.agentType);
    this.emit({
      e: "SubagentStart",
      t: timestampMs(first),
      aid: agentId,
      ...at ? { at } : {}
    });
    for (const entry of entries2) {
      const ms = timestampMs(entry);
      this.lastMs = Math.max(this.lastMs, ms);
      if (entry.type === "user") {
        this.sends.delete(agentId);
        this.toolResults(entry, ms, agentId);
      } else if (entry.type === "assistant") this.assistant(entry, ms, agentId);
      else if (entry.type === "api-request") this.request(entry, ms, agentId);
      else if (entry.type === "attachment") {
        const notice = parseNotification(JSON.stringify(entry.attachment ?? ""), ms);
        if (notice) this.notifications.push(notice);
      }
    }
    this.emit({ e: "SubagentStop", t: timestampMs(last), aid: agentId });
  }
  user(entry, ms, agentId) {
    this.sends.delete(agentId ?? "");
    if (agentId) {
      this.toolResults(entry, ms, agentId);
      return;
    }
    const kind = promptKind(entry);
    if (kind === "none") {
      const ended = !this.turnOpen || this.turnEndMark !== void 0;
      if (messageText(entry).startsWith("[Request interrupted")) {
        if (!ended) this.lastActivity = Math.max(this.lastActivity, ms);
      } else if (ended && entry.isCompactSummary !== true && !contentBlocks(entry).some((b) => b.type === "tool_result")) {
        this.pendingPrompt ??= ms;
      }
      this.toolResults(entry, ms, void 0);
      return;
    }
    if (this.turnOpen) this.closeTurn();
    const text = messageText(entry);
    if (kind === "notification") {
      const notice = parseNotification(text, ms);
      if (notice) this.notifications.push(notice);
    } else if (this.options.detail && !this.title) {
      this.title = oneLine2(text);
    }
    this.startTurn(ms, kind === "notification" ? "task-notification" : void 0);
  }
  startTurn(ms, src) {
    this.emit({ e: "UserPromptSubmit", t: ms, ...src ? { src } : {} });
    this.turnOpen = true;
    this.turnStart = ms;
    this.lastActivity = ms;
    this.turnEndMark = void 0;
    this.pendingPrompt = void 0;
  }
  closeTurn() {
    const end = this.turnEndMark !== void 0 && this.turnEndMark >= this.lastActivity ? this.turnEndMark : this.lastActivity;
    this.emit({ e: "Stop", t: Math.max(end, this.turnStart) });
    this.turnOpen = false;
  }
  toolResults(entry, ms, agentId) {
    const result2 = obj3(entry.toolUseResult);
    const decision = obj3(entry.permissionDecision);
    for (const block of contentBlocks(entry)) {
      if (block.type !== "tool_result") {
        if (!BLOCK_TYPES.has(String(block.type))) this.count(`block:${String(block.type)}`);
        continue;
      }
      const tuid = str3(block.tool_use_id);
      if (!tuid) continue;
      if (!agentId) this.lastActivity = Math.max(this.lastActivity, ms);
      const text = resultText(block);
      const failed = block.is_error === true;
      const source = str3(decision?.source) ?? "";
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
      if (str3(decision?.decision) === "reject") {
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
      if (result2?.interrupted === true) event.intr = true;
      const child = str3(result2?.agentId);
      if (child && use && (use.name === "Agent" || use.name === "Task")) {
        event.child = child;
        const type = str3(result2?.agentType);
        if (type && !this.agentTypes.has(child)) this.agentTypes.set(child, type);
      }
      let bgid = str3(result2?.backgroundTaskId);
      if (!bgid && !failed && use?.name === "Bash") bgid = SHELL_STARTED.exec(text)?.[1];
      const monitor = this.monitors.get(tuid);
      if (monitor && !failed) {
        bgid ??= str3(result2?.taskId) ?? MONITOR_STARTED.exec(text)?.[1];
        if (typeof result2?.timeoutMs === "number") monitor.timeoutMs = result2.timeoutMs;
        if (result2?.persistent === true) monitor.persistent = true;
      }
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
    const message = obj3(entry.message) ?? {};
    const messageId = str3(message.id) ?? str3(entry.uuid);
    if (!agentId && (!this.turnOpen || this.turnEndMark !== void 0 && ms > this.turnEndMark)) {
      if (this.turnOpen) this.closeTurn();
      this.startTurn(Math.min(this.pendingPrompt ?? ms, ms), "system");
    }
    if (!agentId) this.lastActivity = Math.max(this.lastActivity, ms);
    if (messageId) {
      const known = this.messages.get(messageId);
      const record = known ?? { lastMs: ms };
      if (!known) {
        const sentMs = this.resentAt(agentId ?? "", str3(entry.requestRef), ms);
        if (sentMs !== void 0) record.sentMs = sentMs;
      }
      record.lastMs = Math.max(record.lastMs, ms);
      if (agentId) record.agentId = agentId;
      const model = str3(message.model);
      if (model && model !== "<synthetic>") record.model = model;
      const usage2 = obj3(message.usage);
      if (usage2) record.tokens = tokens4(usage2);
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
      const tuid = str3(block.id);
      const name = str3(block.name);
      if (!tuid || !name) continue;
      const input = obj3(block.input) ?? {};
      const event = {
        e: "PreToolUse",
        t: ms,
        tool: name,
        tuid,
        ih: tuid
      };
      const command = str3(input.command);
      if (command) event.cmd = cleanCommand(command);
      const files2 = FILE_KEYS.map((key) => str3(input[key])).filter((f) => !!f);
      if (files2.length > 0) event.files = files2;
      if (input.run_in_background === true) event.bg = true;
      const sub = str3(input.subagent_type);
      if (sub) event.sub = sub;
      const act = toolActions(name, input);
      if (act) event.act = act;
      const ref = str3(input.task_id) ?? str3(input.bash_id) ?? str3(input.shell_id);
      if (ref) event.bgid = ref;
      if (name === "Monitor") {
        const asked = typeof input.timeout_ms === "number" ? input.timeout_ms : MONITOR_TIMEOUT_MS;
        this.monitors.set(tuid, {
          timeoutMs: Math.min(asked, MONITOR_MAX_TIMEOUT_MS),
          persistent: input.persistent === true
        });
      }
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
        const description = str3(input.description);
        if (description) this.details.set(tuid, { description: oneLine2(description) });
      }
    }
  }
  /** An `api-request` entry: a model request sent by the main agent or a subagent. */
  request(entry, ms, agentId) {
    const id = str3(entry.id);
    if (id) this.requests.set(id, ms);
    const key = agentId ?? "";
    this.sends.set(key, [...this.sends.get(key) ?? [], ms]);
  }
  /**
   * When the request behind an answer was sent, if the agent had sent it before: after an API
   * error, a timeout or a rate limit, Claude Code sends the same request again, sometimes for an
   * hour. Undefined when it went out once. `requestRef` names the send that was answered; without
   * it, the last send before the answer.
   */
  resentAt(key, ref, ms) {
    const sends = this.sends.get(key) ?? [];
    this.sends.delete(key);
    const referenced = ref ? this.requests.get(ref) : void 0;
    const sentMs = referenced ?? sends.filter((s) => s <= ms).at(-1);
    if (sentMs === void 0 || sentMs > ms) return void 0;
    return sends.some((s) => s < sentMs) ? sentMs : void 0;
  }
  system(entry, ms) {
    const subtype = str3(entry.subtype) ?? "<none>";
    if (!SYSTEM_SUBTYPES.has(subtype)) {
      this.count(`system:${subtype}`);
      return;
    }
    if (subtype === "turn_duration" || subtype === "stop_hook_summary") {
      this.turnEndMark = Math.max(this.turnEndMark ?? 0, ms);
    } else if (subtype === "compact_boundary") {
      const meta = obj3(entry.compactMetadata) ?? {};
      const duration = typeof meta.durationMs === "number" ? meta.durationMs : 0;
      const trigger = str3(meta.trigger);
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
  /**
   * A background shell runs from its call until its completion notice, or until a TaskStop or
   * KillShell call stops it: a stopped task gets no notice. A Monitor's command runs the same way,
   * and no longer than its timeout. A notice without a status (a Monitor's event) isn't an end.
   */
  addBackgroundSteps(session) {
    const stops = session.steps.filter(
      (s) => s.kind === "tool" && s.backgroundId && STOP_TOOLS.has(s.tool ?? "") && s.ok !== false
    );
    for (const call of session.steps.filter(
      (s) => s.kind === "tool" && s.backgroundId && !TASK_REFS.has(s.tool ?? "")
    )) {
      const notice = this.notifications.filter(
        (n) => n.status !== void 0 && (n.taskId === call.backgroundId || n.toolUseId === call.id) && n.ms >= call.startMs
      ).sort((a, b) => a.ms - b.ms)[0];
      const stop = stops.filter((s) => s.backgroundId === call.backgroundId && s.startMs >= call.endMs).sort((a, b) => a.endMs - b.endMs)[0];
      const stopped = stop !== void 0 && (!notice || stop.endMs < notice.ms);
      let endMs = stopped ? stop.endMs : notice?.ms;
      let unfinished = false;
      const monitor = this.monitors.get(call.id);
      if (monitor) {
        const deadline = Math.min(
          monitor.persistent ? Infinity : call.endMs + monitor.timeoutMs,
          this.lastMs
        );
        if (endMs === void 0) unfinished = true;
        endMs = Math.min(endMs ?? Infinity, deadline);
      }
      if (endMs === void 0 || endMs < call.startMs) continue;
      const step = {
        id: `bg:${call.backgroundId}`,
        parentId: call.id,
        kind: "background",
        startMs: call.startMs,
        endMs,
        flags: stopped ? ["background", "interrupted"] : unfinished ? ["background", "unfinished"] : ["background"],
        backgroundId: call.backgroundId
      };
      if (call.tool) step.tool = call.tool;
      if (call.command) step.command = call.command;
      if (call.agentId) step.agentId = call.agentId;
      if (!stopped && notice?.status) step.ok = notice.status === "completed";
      session.steps.push(step);
    }
  }
  /**
   * The model and tokens of the model call behind each model step. A step whose request was resent
   * starts at the send that was answered: model time covers generating, not resending.
   */
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
      const sent = message?.sentMs;
      if (sent !== void 0 && sent > step.startMs && sent < step.endMs) {
        step.startMs = sent;
        step.flags.push("resent");
      }
    }
  }
};
function tokens4(usage2) {
  const n = (key) => typeof usage2[key] === "number" ? usage2[key] : 0;
  return {
    input: n("input_tokens"),
    output: n("output_tokens"),
    cacheRead: n("cache_read_input_tokens"),
    cacheWrite: n("cache_creation_input_tokens")
  };
}
function oneLine2(text) {
  const plain = text.replace(/<(system-reminder|local-command-caveat|command-message)>[\s\S]*?<\/\1>/g, " ").replace(/<command-name>([^<]*)<\/command-name>/g, "$1 ").replace(/<\/?[a-z][a-z0-9_-]*(?:\s[^>]*)?>/gi, " ").replace(/\s+/g, " ").trim();
  const masked = maskSecrets(plain);
  return masked.length > 160 ? masked.slice(0, 157) + "\u2026" : masked;
}
function clip(text) {
  if (text.length <= MAX_OUTPUT2) return text;
  const head2 = text.slice(0, 1500);
  const tail = text.slice(-2400);
  return `${head2}
\u2026 ${text.length - head2.length - tail.length} characters cut \u2026
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
import { existsSync as existsSync7, readdirSync as readdirSync6, statSync as statSync4 } from "node:fs";
import path12 from "node:path";
function listTranscripts(env = process.env, sinceMs = -Infinity) {
  const root = claudeProjectsDir(env);
  if (!existsSync7(root)) return [];
  const files2 = [];
  for (const project of readdirSync6(root)) {
    const dir = path12.join(root, project);
    let names;
    try {
      if (!statSync4(dir).isDirectory()) continue;
      names = readdirSync6(dir);
    } catch {
      continue;
    }
    for (const name of names) {
      if (!name.endsWith(".jsonl")) continue;
      const file = path12.join(dir, name);
      try {
        const stat2 = statSync4(file);
        if (!stat2.isFile() || stat2.mtimeMs < sinceMs) continue;
        files2.push({
          id: name.slice(0, -".jsonl".length),
          path: file,
          project,
          mtimeMs: stat2.mtimeMs,
          size: stat2.size
        });
      } catch {
      }
    }
  }
  return files2;
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
  for (const file of listAgentSessions(env)) entry(file.id).external = file;
  return index;
}
function latestMs(ref) {
  return Math.max(
    ref.events?.mtimeMs ?? 0,
    ref.transcript?.mtimeMs ?? 0,
    ref.external?.mtimeMs ?? 0
  );
}
function resolveSession(input, env = process.env, project) {
  const external = existsSync8(input) ? detectAgentFile(input) : void 0;
  if (external) return { id: external.id, external };
  if (input.endsWith(".jsonl") && existsSync8(input)) {
    const stat2 = statSync5(input);
    const id = path13.basename(input, ".jsonl");
    const file = { id, path: path13.resolve(input), mtimeMs: stat2.mtimeMs, size: stat2.size };
    if (path13.basename(path13.dirname(input)) === "events") return { id, events: file };
    return { id, transcript: { ...file, project: path13.basename(path13.dirname(input)) } };
  }
  const index = sessionIndex(env);
  if (input === "last" || input === "latest" || input === "current") {
    const candidates = [...index.values()].filter((ref) => !project || refProject(ref) === project);
    const last = candidates.sort((a, b) => latestMs(b) - latestMs(a))[0];
    if (!last) {
      throw new Error(
        'no sessions found. Run "awf import" to read past sessions, or install the plugin to record new ones.'
      );
    }
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
function subagentFiles(transcript) {
  const dir = path13.join(path13.dirname(transcript), path13.basename(transcript, ".jsonl"), "subagents");
  let names;
  try {
    names = readdirSync7(dir);
  } catch {
    return void 0;
  }
  let size2 = 0;
  let mtimeMs = 0;
  for (const name of names) {
    const stat2 = statSync5(path13.join(dir, name), { throwIfNoEntry: false });
    if (!stat2) continue;
    size2 += stat2.size;
    mtimeMs = Math.max(mtimeMs, stat2.mtimeMs);
  }
  return { count: names.length, size: size2, mtimeMs };
}
function activeTranscripts(env, sinceMs) {
  const active = [];
  for (const file of listTranscripts(env)) {
    const subagents = subagentFiles(file.path);
    const activityMs = Math.max(file.mtimeMs, subagents?.mtimeMs ?? 0);
    if (activityMs < sinceMs) continue;
    active.push(
      subagents ? { ...file, activityMs, subagentsMs: subagents.mtimeMs } : { ...file, activityMs }
    );
  }
  return active.sort((a, b) => b.activityMs - a.activityMs);
}
function projectKey(dir) {
  return path13.resolve(dir).replace(/[^A-Za-z0-9]/g, "-");
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
  if (ref.external && existsSync8(ref.external.path)) {
    try {
      return importAgentFile(ref.external, { detail: options.detail ?? false });
    } catch {
    }
  }
  const imported = readImported(ref.id, env);
  if (imported) return { ...imported.session, sources: ["import-cache"] };
  throw new Error(`session ${ref.id} has no readable data`);
}
function existing(file) {
  return file && existsSync8(file) ? file : void 0;
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
      if (!merged.actions && twin.actions) merged.actions = twin.actions;
      if (!merged.backgroundId && twin.backgroundId) merged.backgroundId = twin.backgroundId;
    }
    if (step.kind === "model") {
      const produced = step.produces?.[0];
      const source = produced ? producerOf.get(produced) : transcript.steps.find(
        (t) => t.kind === "model" && !t.produces && t.agentId === step.agentId && t.startMs < step.endMs && t.endMs > step.startMs
      );
      if (source?.model) merged.model = source.model;
      if (source?.tokens) merged.tokens = source.tokens;
      if (source?.flags.includes("resent") && source.startMs > merged.startMs && source.startMs < merged.endMs) {
        merged.startMs = source.startMs;
        merged.flags = [...merged.flags, "resent"];
      }
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
  const project = typeof options.project === "string" ? projectKey(path14.resolve(ctx.cwd, options.project)) : void 0;
  return loadSession(resolveSession(ref, ctx.env, project), { detail, env: ctx.env });
}
function classifier(files2 = diskFiles()) {
  const cache = /* @__PURE__ */ new Map();
  const rulesAt = repoRules(files2);
  return (session) => {
    const key = session.cwd ?? "";
    let c = cache.get(key);
    if (!c) {
      const rules = (session.cwd ? rulesAt(session.cwd) : void 0) ?? defaultRules();
      cache.set(key, c = new Classifier(rules, files2, rulesAt));
    }
    return c.session(session);
  };
}
function loadMany(ctx, options) {
  const since = typeof options.since === "string" ? ctx.now - parseSince(options.since) : -Infinity;
  const project = typeof options.project === "string" ? path14.resolve(ctx.cwd, options.project) : void 0;
  const sessions = [];
  for (const ref of sessionIndex(ctx.env).values()) {
    const session = quick(ref, ctx.env);
    if (!session || session.steps.length === 0 || session.startMs < since) continue;
    if (project && !(session.cwd && (session.cwd === project || session.cwd.startsWith(project + path14.sep))))
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
function table(header2, rows, right = []) {
  const widths2 = header2.map((h, i) => Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length)));
  const line = (cells) => cells.map(
    (cell, i) => right.includes(i) ? cell.padStart(widths2[i] ?? 0) : cell.padEnd(widths2[i] ?? 0)
  ).join("  ").trimEnd();
  return [line(header2), ...rows.map(line)].join("\n");
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
    const home = ctx.env.HOME ?? os4.homedir();
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

// src/analyze/rework.ts
var EDIT_PHASES = /* @__PURE__ */ new Set(["writing-code", "writing-tests"]);
function isEdit(step) {
  return (step.kind === "tool" || step.kind === "background") && !!step.phase && EDIT_PHASES.has(step.phase);
}
function detectRework(input) {
  const steps = input.steps.map((s) => ({ ...s, tags: [...s.tags] }));
  const session = { ...input, steps };
  const ordered = steps.filter((s) => s.kind === "tool" || s.kind === "background").sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
  const open = /* @__PURE__ */ new Map();
  const windows = [];
  for (const step of ordered) {
    if (isEdit(step) && open.size > 0) {
      const window = [...open.values()].filter((w) => w.failedAtMs <= step.startMs).sort((a, b) => b.failedAtMs - a.failedAtMs)[0];
      if (window) {
        step.tags.push(`was:${step.phase}`);
        step.phase = "rework";
        step.reworkFor = window.check;
        window.edits++;
      }
    }
    for (const check of step.checks) {
      const current = open.get(check.key);
      if (check.failed) {
        if (!current) {
          const window = {
            check: check.key,
            failedStepId: step.id,
            failedAtMs: step.endMs,
            edits: 0
          };
          open.set(check.key, window);
          windows.push(window);
        }
      } else if (current && !step.flags.includes("interrupted")) {
        current.passedAtMs = step.endMs;
        open.delete(check.key);
      }
    }
  }
  const byId = new Map(steps.map((s) => [s.id, s]));
  for (const step of steps) {
    if (step.kind !== "model" || !step.produces?.length) continue;
    const phases = [];
    for (const id of step.produces) {
      const produced = byId.get(id);
      if (!produced) continue;
      if (produced.tool && AGENT_TOOLS.has(produced.tool)) phases.push("planning");
      else if (produced.phase === "waiting") phases.push("planning");
      else if (produced.phase) phases.push(produced.phase);
    }
    const phase = topPhase(phases);
    if (phase === "rework" && step.phase !== "rework") {
      step.tags.push(`was:${step.phase}`);
      step.phase = "rework";
      step.reworkFor = step.produces.map((id) => byId.get(id)?.reworkFor).find(Boolean);
    }
  }
  return { session, windows };
}

// src/analyze/timeline.ts
var FOREGROUND = 0;
var BACKGROUND = 1;
var IDLE = 2;
var SERVICE = 3;
var isBackground = (step, background) => step.kind === "background" || background(step);
var isService = (step) => (step.kind === "background" || step.flags.includes("background")) && (step.phase === "running" || step.phase === "unclassified" || step.kind === "background" && step.tool === "Monitor");
function intervals(session) {
  const byId = new Map(session.steps.map((s) => [s.id, s]));
  const background = (step) => {
    if (step.flags.includes("background") || step.kind === "background") return true;
    let parent = step.parentId ? byId.get(step.parentId) : void 0;
    for (let depth = 0; parent && depth < 8; depth++) {
      if (parent.kind === "subagent" && parent.flags.includes("background")) return true;
      parent = parent.parentId ? byId.get(parent.parentId) : void 0;
    }
    return false;
  };
  const out = [];
  for (const step of session.steps) {
    if (!step.phase || step.endMs <= step.startMs) continue;
    if (step.kind === "turn" || step.kind === "subagent") continue;
    const tier = step.kind === "idle" ? IDLE : isBackground(step, background) ? step.phase === "unclassified" || isService(step) ? SERVICE : BACKGROUND : FOREGROUND;
    const wait = step.kind === "tool" && step.waitMs ? Math.min(step.waitMs, step.endMs - step.startMs) : 0;
    if (wait > 0) {
      out.push({
        start: step.startMs,
        end: step.startMs + wait,
        phase: "waiting",
        tier,
        stepId: step.id
      });
      if (step.startMs + wait < step.endMs) {
        out.push({
          start: step.startMs + wait,
          end: step.endMs,
          phase: step.phase,
          tier,
          stepId: step.id
        });
      }
    } else {
      out.push({ start: step.startMs, end: step.endMs, phase: step.phase, tier, stepId: step.id });
    }
  }
  return out;
}
var PHASE_INDEX = new Map(PHASES.map((p, i) => [p.id, i]));
function phaseSegments(session) {
  const start = session.startMs;
  const end = sessionEnd(session);
  const events = [];
  for (const iv of intervals(session)) {
    const a = Math.max(iv.start, start);
    const b = Math.min(iv.end, end);
    if (b <= a) continue;
    const key = iv.tier * 100 + (PHASE_INDEX.get(iv.phase) ?? 0);
    events.push({ t: a, key, delta: 1 }, { t: b, key, delta: -1 });
  }
  events.sort((x, y) => x.t - y.t || x.delta - y.delta);
  const active = /* @__PURE__ */ new Map();
  const segments = [];
  let cursor = start;
  const best = () => {
    let chosen;
    for (const [key, count2] of active) {
      if (count2 <= 0) continue;
      const tier = Math.floor(key / 100);
      const phase = PHASES[key % 100]?.id;
      if (!chosen || tier < chosen.tier || tier === chosen.tier && RANK[phase] > RANK[chosen.phase]) {
        chosen = { tier, phase };
      }
    }
    return chosen?.phase;
  };
  const credit = (until) => {
    if (until <= cursor) return;
    const phase = best();
    const covered = phase !== void 0;
    const last = segments.at(-1);
    if (last && last.end === cursor && last.phase === (phase ?? "unclassified") && last.covered === covered) {
      last.end = until;
    } else {
      segments.push({ start: cursor, end: until, phase: phase ?? "unclassified", covered });
    }
    cursor = until;
  };
  for (const event of events) {
    credit(event.t);
    active.set(event.key, (active.get(event.key) ?? 0) + event.delta);
  }
  credit(end);
  return segments;
}
function sessionEnd(session) {
  const start = session.startMs;
  const end = Math.max(session.endMs, start);
  let lastService = -Infinity;
  let lastOther = start;
  for (const step of session.steps) {
    if (isService(step)) lastService = Math.max(lastService, step.endMs);
    else lastOther = Math.max(lastOther, step.endMs);
  }
  return lastService > lastOther && end > lastOther && end <= lastService ? lastOther : end;
}
function phaseTotals(session) {
  const byPhase = Object.fromEntries(PHASES.map((p) => [p.id, 0]));
  let uncoveredMs = 0;
  let awayWorkMs = 0;
  const gaps = session.steps.filter((s) => s.kind === "idle" && s.endMs > s.startMs).sort((a, b) => a.startMs - b.startMs);
  let g = 0;
  for (const segment of phaseSegments(session)) {
    byPhase[segment.phase] += segment.end - segment.start;
    if (!segment.covered) uncoveredMs += segment.end - segment.start;
    if (segment.phase === "waiting") continue;
    while (g < gaps.length && gaps[g].endMs <= segment.start) g++;
    for (let k = g; k < gaps.length && gaps[k].startMs < segment.end; k++) {
      const gap = gaps[k];
      awayWorkMs += Math.max(
        0,
        Math.min(segment.end, gap.endMs) - Math.max(segment.start, gap.startMs)
      );
    }
  }
  return { totalMs: sessionEnd(session) - session.startMs, byPhase, uncoveredMs, awayWorkMs };
}

// src/analyze/summary.ts
function summarize(classified) {
  const { session, windows } = detectRework(classified);
  const totals = phaseTotals(session);
  const tools = session.steps.filter((s) => s.kind === "tool");
  const count2 = (phase) => tools.filter((s) => s.phase === phase).length;
  const runners = session.steps.filter(
    (s) => (s.kind === "tool" || s.kind === "background") && s.checks.length > 0
  );
  const checks = runners.flatMap((s) => s.checks);
  const phases = PHASES.map(({ id, label: label2 }) => {
    const ms = totals.byPhase[id];
    const line = {
      phase: id,
      label: label2,
      ms,
      share: totals.totalMs > 0 ? ms / totals.totalMs : 0
    };
    if (id === "lint" || id === "tests" || id === "build") {
      const runs = runners.filter((s) => s.checks.some((c) => c.phase === id));
      line.runs = runs.length;
      line.failed = runs.filter((s) => s.checks.some((c) => c.phase === id && c.failed)).length;
    } else if (id === "writing-code" || id === "writing-tests") {
      line.edits = count2(id);
    } else if (id === "rework") {
      line.edits = count2("rework");
      line.failures = windows.filter((w) => w.edits > 0).length;
    } else if (id === "exploring") {
      line.calls = count2("exploring");
    } else if (id === "running") {
      line.calls = count2("running");
      const polling = tools.filter(
        (s) => s.phase === "running" && s.tags.includes("polling") && !s.flags.includes("background")
      ).reduce((n, s) => n + Math.max(0, s.endMs - s.startMs - (s.waitMs ?? 0)), 0);
      line.pollingMs = Math.min(polling, ms);
    } else if (id === "waiting") {
      line.approvals = tools.filter((s) => s.flags.includes("approval")).length;
      line.questions = tools.filter((s) => s.tool === "AskUserQuestion").length;
      line.gaps = session.steps.filter((s) => s.kind === "idle").length;
    } else if (id === "unclassified") {
      line.steps = session.steps.filter((s) => s.phase === "unclassified").length;
    }
    return line;
  });
  const idleMs = session.steps.filter((s) => s.kind === "idle").reduce((n, s) => n + (s.endMs - s.startMs), 0);
  const tokens5 = session.steps.reduce((sum, s) => {
    if (!s.tokens) return sum;
    const base = sum ?? { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
    return {
      input: base.input + s.tokens.input,
      output: base.output + s.tokens.output,
      cacheRead: base.cacheRead + s.tokens.cacheRead,
      cacheWrite: base.cacheWrite + s.tokens.cacheWrite
    };
  }, void 0);
  const summary = {
    id: session.id,
    sources: session.sources,
    startMs: session.startMs,
    endMs: session.startMs + totals.totalMs,
    totalMs: totals.totalMs,
    turnsMs: Math.max(0, totals.totalMs - idleMs),
    awayWorkMs: totals.awayWorkMs,
    phases,
    modelCalls: session.steps.filter((s) => s.kind === "model").length,
    toolCalls: tools.length,
    subagents: session.steps.filter((s) => s.kind === "subagent").length,
    failures: checks.filter((c) => c.failed).length,
    rework: windows,
    uncoveredMs: totals.uncoveredMs
  };
  if (session.title) summary.title = session.title;
  if (session.cwd) summary.cwd = session.cwd;
  if (session.agentVersion) summary.agentVersion = session.agentVersion;
  if (tokens5) summary.tokens = tokens5;
  return { session, summary };
}
var plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
function formatDurationLine(summary) {
  const total = formatDuration(summary.totalMs);
  if (summary.turnsMs >= summary.totalMs) return total;
  const parts = [`${formatDuration(summary.turnsMs)} in turns`];
  if (summary.awayWorkMs > 0)
    parts.push(`${formatDuration(summary.awayWorkMs)} background work between turns`);
  return `${total} (${parts.join(", ")})`;
}
function phaseDetail(line) {
  switch (line.phase) {
    case "lint":
    case "tests":
    case "build":
      return line.runs ? `${plural(line.runs, "run")}${line.failed ? `, ${line.failed} failed` : ""}` : "";
    case "writing-code":
    case "writing-tests":
      return line.edits ? plural(line.edits, "edit") : "";
    case "rework":
      return line.edits ? `${plural(line.edits, "edit")} after ${plural(line.failures ?? 0, "failed check")}` : "";
    case "exploring":
      return line.calls ? plural(line.calls, "call") : "";
    case "running":
      return line.calls ? `${plural(line.calls, "call")}${line.pollingMs ? `, ${formatDuration(line.pollingMs)} polling` : ""}` : "";
    case "waiting": {
      const parts = [
        line.approvals ? plural(line.approvals, "approval") : "",
        line.questions ? plural(line.questions, "question") : "",
        line.gaps ? plural(line.gaps, "idle gap") : ""
      ].filter(Boolean);
      return parts.join(", ");
    }
    case "unclassified":
      return line.steps ? plural(line.steps, "step") : "";
    default:
      return "";
  }
}
var ALWAYS = /* @__PURE__ */ new Set(["rework", "waiting", "unclassified"]);
function formatSummaryLines(summary) {
  const lines = summary.phases.filter((p) => p.ms > 0 || ALWAYS.has(p.phase));
  const labelWidth = Math.max(...lines.map((p) => PHASE_LABEL[p.phase].length), "Total".length);
  const timeWidth = Math.max(
    ...lines.map((p) => formatDuration(p.ms).length),
    formatDuration(summary.totalMs).length
  );
  const out = lines.map((p) => {
    const pct2 = `${Math.round(p.share * 100)}%`.padStart(4);
    const detail = phaseDetail(p);
    return `${p.label.padEnd(labelWidth)}  ${formatDuration(p.ms).padStart(timeWidth)} \xB7 ${pct2}${detail ? ` \xB7 ${detail}` : ""}`;
  });
  const totals = [
    plural(summary.modelCalls, "model call"),
    plural(summary.toolCalls, "tool call"),
    ...summary.subagents ? [plural(summary.subagents, "subagent")] : [],
    plural(summary.failures, "failure")
  ];
  out.push(
    `${"Total".padEnd(labelWidth)}  ${formatDuration(summary.totalMs).padStart(timeWidth)} \xB7 100% \xB7 ${totals.join(", ")}`
  );
  return out;
}

// src/cli/commands/compare.ts
var DAY = 864e5;
function parseRange(text, now) {
  const date = (s) => {
    const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(s);
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime() : void 0;
  };
  const age = (s) => /^\d+(\.\d+)?\s*[mhdw]$/.test(s) ? now - parseSince(s) : void 0;
  const [a = "", b] = text.split("..");
  if (b === void 0) {
    const day = date(a);
    if (day !== void 0) return { from: day, to: day + DAY };
    const since = age(a);
    return since !== void 0 ? { from: since, to: now } : void 0;
  }
  const from = date(a) ?? age(a);
  const to = date(b) !== void 0 ? date(b) + DAY : age(b);
  if (from === void 0 || to === void 0) return void 0;
  return from <= to ? { from, to } : { from: to, to: from };
}
function sideOf(label2, summaries) {
  const totalMs = summaries.reduce((n, s) => n + s.totalMs, 0);
  const sum = (pick) => summaries.reduce((n, s) => n + pick(s), 0);
  return {
    label: label2,
    sessions: summaries.length,
    totalMs,
    turnsMs: sum((s) => s.turnsMs),
    awayWorkMs: sum((s) => s.awayWorkMs),
    phases: PHASES.map(({ id, label: name }) => {
      const ms = sum((s) => s.phases.find((p) => p.phase === id)?.ms ?? 0);
      return { phase: id, label: name, ms, share: totalMs > 0 ? ms / totalMs : 0 };
    }),
    modelCalls: sum((s) => s.modelCalls),
    toolCalls: sum((s) => s.toolCalls),
    failures: sum((s) => s.failures),
    reworkLoops: sum((s) => s.rework.filter((w) => w.edits > 0).length)
  };
}
function load(ctx, text, options) {
  const classify = classifier();
  const range = parseRange(text, ctx.now);
  if (range) {
    const sessions = loadMany(ctx, options).filter(
      (s) => s.startMs >= range.from && s.startMs < range.to
    );
    if (sessions.length === 0) throw new Error(`no sessions in ${text}. Run "awf import" first?`);
    return sideOf(
      text,
      sessions.map((s) => summarize(classify(s)).summary)
    );
  }
  const session = loadOne(ctx, text, options, false);
  const { summary } = summarize(classify(session));
  return sideOf(`${session.id.slice(0, 8)} (${formatClock(session.startMs)})`, [summary]);
}
var pts = (a, b) => {
  const d = Math.round((b - a) * 100);
  return d === 0 ? "0" : `${d > 0 ? "+" : "\u2212"}${Math.abs(d)} pts`;
};
var delta = (a, b) => b === a ? "" : `${b > a ? "+" : "\u2212"}${formatDuration(Math.abs(b - a))}`;
var count = (a, b) => b === a ? "" : `${b > a ? "+" : "\u2212"}${Math.abs(b - a)}`;
var compareCommand = {
  summary: "Phase totals side by side for two sessions or date ranges",
  usage: `Usage: awf compare <before> <after> [--project <dir>] [--json]

Shows each phase's time and share for two sessions, or two time ranges summed, and the change
from the first to the second: a before/after check for a faster build or test setup.
Each side is a session (ID, its first characters, "last", or a file) or a range:
  2026-10-01..2026-10-15   those days (the end day included)
  2026-10-20               that day
  7d                       the last 7 days (also h, w, m for hours, weeks, minutes)
  14d..7d                  from 14 days ago to 7 days ago
  --project <dir>   only sessions started in this folder or below it
  --json            print JSON`,
  options: { project: { type: "string" }, json: { type: "boolean" } },
  run(ctx, args, options) {
    if (args.length !== 2) throw new Error("compare needs two sides: awf compare <before> <after>");
    const [a, b] = [load(ctx, args[0], options), load(ctx, args[1], options)];
    if (options.json) {
      const changes = a.phases.map((p, i) => ({
        phase: p.phase,
        ms: (b.phases[i]?.ms ?? 0) - p.ms,
        share: (b.phases[i]?.share ?? 0) - p.share
      }));
      ctx.io.out(JSON.stringify({ before: a, after: b, changes }, null, 2));
      return 0;
    }
    const perSession = a.sessions > 1 || b.sessions > 1;
    ctx.io.out(
      `Before: ${a.label}${perSession ? ` \xB7 ${a.sessions} sessions` : ""} \xB7 ${formatDuration(a.totalMs)}`
    );
    ctx.io.out(
      `After:  ${b.label}${perSession ? ` \xB7 ${b.sessions} sessions` : ""} \xB7 ${formatDuration(b.totalMs)}`
    );
    ctx.io.out("");
    const rows = a.phases.map((p, i) => [p, b.phases[i]]).filter(([p, q]) => p.ms > 0 || (q?.ms ?? 0) > 0).map(([p, q]) => [
      p.label,
      formatDuration(p.ms),
      `${Math.round(p.share * 100)}%`,
      formatDuration(q?.ms ?? 0),
      `${Math.round((q?.share ?? 0) * 100)}%`,
      pts(p.share, q?.share ?? 0),
      delta(p.ms, q?.ms ?? 0)
    ]);
    rows.push([
      "Total",
      formatDuration(a.totalMs),
      "100%",
      formatDuration(b.totalMs),
      "100%",
      "",
      delta(a.totalMs, b.totalMs)
    ]);
    ctx.io.out(
      table(
        ["PHASE", "BEFORE", "SHARE", "AFTER", "SHARE", "SHARE CHANGE", "TIME CHANGE"],
        rows,
        [1, 2, 3, 4, 5, 6]
      )
    );
    ctx.io.out("");
    const facts = [
      ["Failed checks", a.failures, b.failures],
      ["Rework loops", a.reworkLoops, b.reworkLoops],
      ["Model calls", a.modelCalls, b.modelCalls],
      ["Tool calls", a.toolCalls, b.toolCalls],
      ...perSession ? [["Sessions", a.sessions, b.sessions]] : []
    ];
    ctx.io.out(
      table(
        ["", "BEFORE", "AFTER", "CHANGE"],
        facts.map(([name, x, y]) => [name, String(x), String(y), count(x, y)]),
        [1, 2, 3]
      )
    );
    if (perSession && a.sessions !== b.sessions)
      ctx.io.out(
        "\nThe sides have different numbers of sessions: compare the shares, not the times."
      );
    return 0;
  }
};

// src/cli/commands/doctor.ts
import os5 from "node:os";
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
      for (const [type, count2] of Object.entries(session?.diagnostics?.unknownEntries ?? {})) {
        const entry = unknown.get(type) ?? { count: 0, versions: /* @__PURE__ */ new Set() };
        entry.count += count2;
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
    const home = ctx.env.HOME ?? os5.homedir();
    const recorder = events.length === 0 ? [
      "no events yet. Install the plugin:",
      "          claude plugin marketplace add Jccorzo/awf",
      "          claude plugin install awf@awf"
    ].join("\n") : `${events.length} sessions, last event ${formatDuration(ctx.now - lastEvent)} ago`;
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
import os6 from "node:os";
import path15 from "node:path";
function inProject(folder, dir) {
  if (!dir) return true;
  const key = projectKey(dir);
  return folder === key || folder.startsWith(key + "-");
}
var importCommand = {
  summary: "Import past sessions from Claude Code, Codex, Gemini and OpenCode (read-only)",
  usage: `Usage: awf import [--since 30d] [--project <dir>] [--agent <name>] [--force] [--dry-run] [--json]

Reads every Claude Code transcript under ~/.claude/projects/, and the session logs of Codex CLI
(~/.codex/sessions), Gemini CLI (~/.gemini/tmp) and OpenCode (~/.local/share/opencode/storage),
all read-only, and keeps the timings in ~/.awf/imported/, so your history survives the agents
deleting old logs. Prints the sessions, steps and any log entries awf doesn't recognise.
  --since <age>     only logs changed within this age
  --project <dir>   only sessions started in this folder or below it
  --agent <name>    only one agent: claude-code, codex, gemini or opencode
  --force           re-import transcripts that haven't changed
  --dry-run         read and report, but write nothing
  --json            print JSON`,
  options: {
    since: { type: "string" },
    project: { type: "string" },
    agent: { type: "string" },
    force: { type: "boolean" },
    "dry-run": { type: "boolean" },
    json: { type: "boolean" }
  },
  run(ctx, _args, options) {
    const since = typeof options.since === "string" ? ctx.now - parseSince(options.since) : -Infinity;
    const project = typeof options.project === "string" ? path15.resolve(ctx.cwd, options.project) : void 0;
    const agent = typeof options.agent === "string" ? options.agent : void 0;
    if (agent && !(agent in AGENT_NAMES))
      throw new Error(`unknown agent "${agent}": use ${Object.keys(AGENT_NAMES).join(", ")}`);
    const files2 = (!agent || agent === "claude-code" ? listTranscripts(ctx.env, since) : []).filter((f) => inProject(f.project, project)).map((f) => ({ ...f, read: () => importClaudeCodeTranscript(f.path), agent: "claude-code" }));
    for (const f of listAgentSessions(ctx.env, since)) {
      if (agent && f.agent !== agent) continue;
      files2.push({ ...f, project: "", read: () => importAgentFile(f), agent: f.agent });
    }
    const report = {
      transcripts: files2.length,
      agents: {},
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
    for (const file of files2) {
      let session;
      const cached = options.force ? void 0 : readImported(file.id, ctx.env);
      if (cached?.version === IMPORT_VERSION && cached.source.mtimeMs === file.mtimeMs && cached.source.size === file.size) {
        session = cached.session;
        report.unchanged++;
      } else {
        try {
          session = file.read();
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
              version: IMPORT_VERSION,
              source: { path: file.path, mtimeMs: file.mtimeMs, size: file.size },
              session: stripDetail(session)
            },
            ctx.env
          );
        }
        report.imported++;
      }
      if (file.agent !== "claude-code" && project && !(session.cwd && (session.cwd === project || session.cwd.startsWith(project + path15.sep)))) {
        report.transcripts--;
        continue;
      }
      report.agents[file.agent] = (report.agents[file.agent] ?? 0) + 1;
      report.steps += session.steps.length;
      report.toolCalls += session.steps.filter((s) => s.kind === "tool").length;
      report.badLines += session.diagnostics?.badLines ?? 0;
      if (session.agentVersion && session.agent === "claude-code")
        versions.add(session.agentVersion);
      for (const [type, count2] of Object.entries(session.diagnostics?.unknownEntries ?? {})) {
        const key = session.agent === "claude-code" ? type : `${session.agent}:${type}`;
        const entry = report.unknownEntries[key] ??= { count: 0, versions: [] };
        entry.count += count2;
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
    const home = ctx.env.HOME ?? os6.homedir();
    const verb = options["dry-run"] ? "Read" : "Imported";
    const byAgent = Object.entries(report.agents).map(([name, n]) => `${AGENT_NAMES[name] ?? name} ${n}`).join(", ");
    const from = Object.keys(report.agents).every((a) => a === "claude-code") ? `from ${homeRelative(claudeProjectsDir(ctx.env), home)} ` : `(${byAgent}) `;
    ctx.io.out(
      `${verb} ${report.transcripts - report.errors.length} of ${report.transcripts} sessions ${from}(${report.imported} new or changed, ${report.unchanged} unchanged): ${report.steps.toLocaleString("en-US")} steps, ${report.toolCalls.toLocaleString("en-US")} tool calls.`
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

// src/cli/commands/live.ts
import { readFileSync as readFileSync10, statSync as statSync7 } from "node:fs";
import os7 from "node:os";
import path18 from "node:path";

// src/live/state.ts
var QUESTION_TOOLS = /* @__PURE__ */ new Set([
  "AskUserQuestion",
  "ExitPlanMode",
  "mcp__computer-use__request_access"
]);
var STOP_TOOLS2 = /* @__PURE__ */ new Set(["TaskStop", "KillShell", "KillBash"]);
var TASK_REFS2 = /* @__PURE__ */ new Set([...STOP_TOOLS2, "TaskOutput", "BashOutput"]);
var TASK_TOOLS = /* @__PURE__ */ new Set(["Monitor", "Workflow"]);
var END_REASONS = /* @__PURE__ */ new Set(["end_turn", "stop_sequence"]);
var IDLE_AFTER_MS = 5 * 6e4;
var MAX_TITLE = 160;
var ACTIVITY = /* @__PURE__ */ new Set([
  "user",
  "assistant",
  "system",
  "api-request",
  "queue-operation",
  "attachment"
]);
var SERVERS = [
  // A package script that serves: pnpm dev, pnpm -C core dev, yarn dev:web, npm start, npx serve.
  /\b(?:npm|pnpm|yarn|bun|npx|bunx)\b[^;&|]*?\s(?:dev|start|serve|server|preview|watch|storybook)(?::[\w-]+)*(?=$|[\s;&|)])/,
  /\b(?:next|vite|nuxt|nuxi|astro|remix|gatsby|expo|storybook|wrangler|webpack|rspack|ng|react-scripts|vue-cli-service)\s+(?:dev|develop|start|serve|preview)\b/,
  /\bvite(?=$|\s+-|\s*[;&|)])/,
  /(?:^|[\s;&|(/])(?:nodemon|http-server|live-server|json-server|browser-sync|uvicorn|gunicorn|hypercorn|daphne|streamlit|gradio|jupyter|puma|rackup|foreman|overmind|ngrok|cloudflared|caddy|cloud-sql-proxy|cloud_sql_proxy|redis-server|mongod|mailhog|mailpit)(?=$|[\s;&|)])/,
  /\bpython[\d.]*\s+-m\s+http\.server\b|\bflask\s+run\b|\brails\s+s(?:erver)?\b|\bphp\s+-S\b/,
  /\b(?:docker|podman)[\s-]compose\s+(?:\S+\s+)*?up\b(?![^;&|]*\s(?:-d|--detach)\b)/,
  /\bkubectl\s+port-forward\b|\btail\s+-[fF]\b/,
  // Any program's serve subcommand: firebase serve, registry serve, manage.py runserver.
  /\s(?:serve|server|runserver)(?=$|[\s;&|)])/,
  // A server by its file (node server.mjs), or by where it listens (PORT=8080 ./api, --port 3000).
  /\bserver\.(?:[cm]?js|[cm]?ts|py|rb)\b/,
  /(?:^|[\s;&|(])(?:PORT=\d|[A-Z_]*_(?:BIND|LISTEN)(?:_ADDR)?=)|\s--(?:port|bind|listen)[=\s]/
];
var ENDS = /\b(?:kill|pkill|killall|timeout|gtimeout|test|tests|spec|e2e|playwright|cypress|jest|vitest|pytest|xcodebuild)\b|\s--(?:help|version)\b/;
function isServer(command) {
  return !ENDS.test(command) && SERVERS.some((pattern) => pattern.test(command));
}
function transcriptFacts(text) {
  let cwd;
  let customTitle;
  let aiTitle;
  let firstPrompt;
  let firstCommand;
  let turnOpen = false;
  let promptOnly = false;
  let endedMs;
  let lastMs;
  const open = /* @__PURE__ */ new Map();
  const calls = /* @__PURE__ */ new Map();
  const background = /* @__PURE__ */ new Map();
  const finished = /* @__PURE__ */ new Set();
  const work = () => {
    turnOpen = true;
    promptOnly = false;
    endedMs = void 0;
  };
  const end = (ms) => {
    turnOpen = false;
    endedMs = ms;
    open.clear();
  };
  const finish = (taskId, callId) => {
    if (taskId) {
      finished.add(taskId);
      background.delete(taskId);
    }
    if (callId) {
      for (const [id, task] of background) if (task.id === callId) background.delete(id);
    }
  };
  const notices = (text2) => {
    for (const chunk of text2.split("<task-notification>").slice(1)) {
      const tag = (name) => new RegExp(`<${name}>([^<]*)</${name}>`).exec(chunk)?.[1]?.trim() || void 0;
      if (tag("status")) finish(tag("task-id"), tag("tool-use-id"));
    }
  };
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      continue;
    }
    const entry = obj3(parsed);
    if (!entry) continue;
    if (entry.type === "custom-title") customTitle = str3(entry.customTitle) ?? customTitle;
    if (entry.type === "ai-title") aiTitle = str3(entry.aiTitle) ?? aiTitle;
    if (entry.type === "cost-state") {
      if (turnOpen && lastMs !== void 0) end(lastMs);
      open.clear();
      background.clear();
      continue;
    }
    if (entry.isSidechain === true) continue;
    const ms = timestampMs(entry);
    if (ms === void 0 || !ACTIVITY.has(String(entry.type))) continue;
    cwd ??= str3(entry.cwd);
    lastMs = Math.max(lastMs ?? ms, ms);
    switch (entry.type) {
      case "user": {
        const kind = promptKind(entry);
        const text2 = messageText(entry);
        if (kind !== "none") {
          if (kind === "notification") notices(text2);
          else if (!firstPrompt) {
            const clean2 = oneLine3(text2);
            if (clean2.startsWith("/")) firstCommand ??= clean2;
            else if (clean2) firstPrompt = clean2;
          }
          work();
          promptOnly = true;
          break;
        }
        if (promptOnly && turnOpen && text2.trimStart().startsWith("<local-command-stdout>")) {
          end(ms);
          break;
        }
        const result2 = obj3(entry.toolUseResult);
        for (const block of contentBlocks(entry)) {
          if (block.type !== "tool_result") continue;
          const id = str3(block.tool_use_id);
          if (!id) continue;
          if (open.delete(id)) work();
          const call = calls.get(id);
          const tool = call?.tool;
          if (block.is_error === true || !result2 || !tool || TASK_REFS2.has(tool)) continue;
          const taskId = str3(result2.backgroundTaskId) ?? (result2.isAsync === true || result2.status === "async_launched" ? str3(result2.agentId) : void 0) ?? (TASK_TOOLS.has(tool) ? str3(result2.taskId) : void 0);
          if (taskId && !finished.has(taskId)) background.set(taskId, { ...call, ms });
        }
        if (text2.trimStart().startsWith("[Request interrupted")) end(ms);
        break;
      }
      case "assistant": {
        work();
        if (entry.isApiErrorMessage === true) {
          end(ms);
          break;
        }
        let used = false;
        for (const block of contentBlocks(entry)) {
          if (block.type !== "tool_use") continue;
          const id = str3(block.id);
          const tool = str3(block.name);
          if (!id || !tool) continue;
          used = true;
          const input = obj3(block.input) ?? {};
          const command = tool === "Bash" ? str3(input.command) : void 0;
          const call = command ? { id, tool, ms, command } : { id, tool, ms };
          open.set(id, call);
          calls.set(id, call);
          if (STOP_TOOLS2.has(tool)) {
            finish(str3(input.task_id) ?? str3(input.bash_id) ?? str3(input.shell_id));
          }
        }
        const reason = str3(obj3(entry.message)?.stop_reason);
        if (!used && reason && END_REASONS.has(reason) && open.size === 0) end(ms);
        break;
      }
      case "api-request":
        work();
        break;
      case "system": {
        const subtype = str3(entry.subtype);
        if (subtype === "turn_duration" || subtype === "stop_hook_summary") end(ms);
        break;
      }
      case "queue-operation":
        if (entry.operation === "enqueue") notices(str3(entry.content) ?? "");
        break;
      case "attachment":
        notices(JSON.stringify(entry.attachment ?? ""));
        break;
    }
  }
  const facts = {
    turnOpen,
    openCalls: [...open.values()],
    background: [...background.values()]
  };
  if (cwd) facts.cwd = cwd;
  const title = oneLine3(customTitle ?? "") || oneLine3(aiTitle ?? "") || firstPrompt || firstCommand;
  if (title) facts.title = title;
  if (endedMs !== void 0) facts.endedMs = endedMs;
  if (lastMs !== void 0) facts.lastMs = lastMs;
  return facts;
}
function oneLine3(text) {
  const plain = text.replace(/<(system-reminder|local-command-caveat|command-message)>[\s\S]*?<\/\1>/g, " ").replace(/<command-name>([^<]*)<\/command-name>/g, "$1 ").replace(/<\/?[a-z][a-z0-9_-]*(?:\s[^>]*)?>/gi, " ").replace(/[\u0000-\u001f\u007f-\u009f]/g, " ").replace(/\s+/g, " ").trim();
  const masked = maskSecrets(plain);
  return masked.length > MAX_TITLE ? masked.slice(0, MAX_TITLE - 1) + "\u2026" : masked;
}
function liveState(facts, now, events) {
  const background = facts.background.length;
  const servers = facts.background.filter((task) => task.command && isServer(task.command)).length;
  const counts = { background, servers };
  if (facts.turnOpen) {
    const question = facts.openCalls.find((c) => QUESTION_TOOLS.has(c.tool));
    if (question) return waiting(question.ms, now, counts, question.tool);
  }
  if (facts.turnOpen || background > servers) {
    if (events && approvalPending(events, facts)) return { kind: "approval", ...counts };
    return { kind: "working", why: facts.turnOpen ? "turn" : "background", ...counts };
  }
  return waiting(facts.endedMs ?? facts.lastMs ?? now, now, counts);
}
function waiting(sinceMs, now, counts, question) {
  const state = {
    kind: now - sinceMs >= IDLE_AFTER_MS ? "idle" : "your-turn",
    sinceMs,
    ...counts
  };
  if (question) state.question = question;
  return state;
}
function approvalPending(events, facts) {
  const calls = [];
  const ended = /* @__PURE__ */ new Set();
  const stopped = /* @__PURE__ */ new Set();
  const requests = [];
  for (const event of events) {
    switch (event.e) {
      case "PreToolUse":
        if (event.tuid) calls.push(event);
        break;
      case "PostToolUse":
      case "PostToolUseFailure":
      case "PermissionDenied":
        if (event.tuid) ended.add(event.tuid);
        break;
      case "SubagentStop":
        if (event.aid) stopped.add(event.aid);
        break;
      case "PermissionRequest":
        requests.push(event);
        break;
    }
  }
  const openInTranscript = new Set(facts.openCalls.map((c) => c.id));
  return requests.some((request) => {
    if (!request.ih) return false;
    const call = calls.findLast(
      (c) => c.ih === request.ih && c.tool === request.tool && c.aid === request.aid && !ended.has(c.tuid)
    );
    if (!call) return false;
    return call.aid ? !stopped.has(call.aid) : openInTranscript.has(call.tuid);
  });
}
function stateLabel(state, now) {
  switch (state.kind) {
    case "working":
      return "working";
    case "approval":
      return "approval?";
    case "your-turn":
      return "your turn";
    case "idle":
      return `idle ${idleFor(now - (state.sinceMs ?? now))}`;
  }
}
function idleFor(ms) {
  const minutes = Math.max(0, Math.floor(ms / 6e4));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h${String(minutes % 60).padStart(2, "0")}m`;
  return `${Math.floor(hours / 24)}d`;
}

// src/cli/board.ts
import path17 from "node:path";

// src/cli/commands/statusline.ts
import {
  mkdirSync as mkdirSync2,
  readdirSync as readdirSync8,
  readFileSync as readFileSync9,
  renameSync as renameSync2,
  rmSync,
  statSync as statSync6,
  writeFileSync as writeFileSync2
} from "node:fs";
import path16 from "node:path";
var FORMAT = 2;
var MAX_WIDTH = 64;
var KEEP_MS = 30 * 864e5;
var SHORT_NAME = {
  "writing-code": "code",
  "writing-tests": "test code",
  lint: "lint",
  tests: "tests",
  build: "build",
  rework: "rework",
  exploring: "explore",
  running: "scripts",
  planning: "plan",
  waiting: "waiting",
  unclassified: "unclassified"
};
var COLOR = {
  "writing-code": "#2a78d6",
  "writing-tests": "#d95926",
  lint: "#199e70",
  tests: "#c98500",
  build: "#d55181",
  rework: "#7a6ae0",
  exploring: "#008300",
  running: "#2a8ca3",
  planning: "#7b8494",
  waiting: "#a9a8a0",
  unclassified: "#8c8b84"
};
var FAILED_COLOR = "#d03b3b";
var DEFAULT_PIN = ["tests"];
function parsePin(value) {
  if (value === void 0) return DEFAULT_PIN;
  const byName = /* @__PURE__ */ new Map();
  for (const [id, name] of Object.entries(SHORT_NAME)) {
    byName.set(id, id);
    byName.set(name, id);
  }
  const pins = value.split(",").map((name) => byName.get(name.trim()));
  return [...new Set(pins)].filter((p) => p !== void 0 && p !== "waiting");
}
function statusParts(summary, top = 3, pinned = DEFAULT_PIN) {
  const working = summary.phases.filter((p) => p.phase !== "waiting");
  const workingMs = working.reduce((n, p) => n + p.ms, 0);
  const share = (ms) => workingMs > 0 ? ms / workingMs : 0;
  const pins = pinned.map((phase) => {
    const ms = working.find((p) => p.phase === phase)?.ms ?? 0;
    return { phase, ms, share: share(ms), pinned: true };
  });
  const others = working.filter((p) => p.ms > 0 && !pinned.includes(p.phase)).sort((a, b) => b.ms - a.ms).slice(0, Math.max(0, top - pins.length)).map((p) => ({ phase: p.phase, ms: p.ms, share: share(p.ms) }));
  return {
    // Nothing worked yet: no line rather than "tests 0%".
    phases: workingMs > 0 ? [...pins, ...others] : [],
    failed: summary.phases.reduce((n, p) => n + (p.failed ?? 0), 0),
    reworkMs: summary.phases.find((p) => p.phase === "rework")?.ms ?? 0,
    workingMs
  };
}
function shortDuration(ms) {
  const s = Math.round(ms / 1e3);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}m`;
}
function percent(share) {
  if (share === 0) return "0%";
  const n = Math.round(share * 100);
  return n === 0 ? "<1%" : `${n}%`;
}
function colorMode(env) {
  if (env.NO_COLOR) return "none";
  return /truecolor|24bit/i.test(env.COLORTERM ?? "") ? "truecolor" : "256";
}
function xterm256(r, g, b) {
  const levels = [0, 95, 135, 175, 215, 255];
  const nearest2 = (v) => levels.reduce(
    (best, level, i) => Math.abs(level - v) < Math.abs(levels[best] - v) ? i : best,
    0
  );
  return 16 + 36 * nearest2(r) + 6 * nearest2(g) + nearest2(b);
}
function paint(text, hex, mode) {
  if (mode === "none") return text;
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const code = mode === "truecolor" ? `38;2;${r};${g};${b}` : `38;5;${xterm256(r, g, b)}`;
  return `\x1B[${code}m${text}\x1B[39m`;
}
function renderStatus(parts, mode) {
  const phases = parts.phases.map((p) => ({
    name: SHORT_NAME[p.phase],
    color: COLOR[p.phase],
    value: percent(p.share),
    ...p.pinned ? { pinned: true } : {}
  }));
  if (phases.length === 0) return "";
  const tail = [];
  if (parts.failed > 0) tail.push({ name: `${parts.failed} failed`, color: FAILED_COLOR });
  if (parts.reworkMs >= 1e3 && !parts.phases.some((p) => p.phase === "rework"))
    tail.push({ name: "rework", color: COLOR.rework, value: shortDuration(parts.reworkMs) });
  const text = (item) => item.value ? `${item.name} ${item.value}` : item.name;
  const width = (items) => items.map(text).join(" \xB7 ").length;
  while (phases.length > 1 && width([...phases, ...tail]) > MAX_WIDTH) {
    const last = phases.map((p) => !p.pinned).lastIndexOf(true);
    if (last < 0) break;
    phases.splice(last, 1);
  }
  const separator = mode === "none" ? " \xB7 " : " \x1B[2m\xB7\x1B[22m ";
  return [...phases, ...tail].map((item) => paint(item.name, item.color, mode) + (item.value ? ` ${item.value}` : "")).join(separator);
}
function stamp(stat2) {
  return stat2 ? `${stat2.size}:${stat2.mtimeMs}` : "-";
}
function subagentStamp(transcript) {
  const files2 = subagentFiles(transcript);
  return files2 ? `${files2.count}:${files2.size}:${files2.mtimeMs}` : "-";
}
function readCache(file, key) {
  try {
    const cached = JSON.parse(readFileSync9(file, "utf8"));
    return cached.key === key && typeof cached.line === "string" ? cached.line : void 0;
  } catch {
    return void 0;
  }
}
function writeCache(file, key, line, now) {
  try {
    const dir = path16.dirname(file);
    mkdirSync2(dir, { recursive: true });
    const temp = `${file}.${process.pid}.tmp`;
    writeFileSync2(temp, JSON.stringify({ key, line }));
    renameSync2(temp, file);
    for (const name of readdirSync8(dir)) {
      const other = path16.join(dir, name);
      const stat2 = statSync6(other, { throwIfNoEntry: false });
      if (stat2 && now - stat2.mtimeMs > KEEP_MS) rmSync(other, { force: true });
    }
  } catch {
  }
}
function lineSource(env, transcript, id) {
  if (!transcript.endsWith(".jsonl")) return void 0;
  const transcriptStat = statSync6(transcript, { throwIfNoEntry: false });
  if (!transcriptStat?.isFile()) return void 0;
  const events = path16.join(eventsDir(env), `${safeId(id)}.jsonl`);
  const eventsStat = statSync6(events, { throwIfNoEntry: false });
  return { id, transcript, transcriptStat, events, eventsStat };
}
function cacheKey(source, mode, pin) {
  return [
    FORMAT,
    VERSION,
    // A new importer reads the same transcript differently: lines cached before it are stale.
    IMPORT_VERSION,
    mode,
    pin.join(","),
    stamp(source.transcriptStat),
    stamp(source.eventsStat),
    subagentStamp(source.transcript)
  ].join("|");
}
function cachePath(env, id) {
  return path16.join(cacheDir(env), "statusline", `${safeId(id)}.json`);
}
function sessionSummary(env, source) {
  const ref = resolveSession(source.transcript, env);
  if (source.eventsStat?.isFile())
    ref.events = {
      id: source.id,
      path: source.events,
      mtimeMs: source.eventsStat.mtimeMs,
      size: source.eventsStat.size
    };
  return summarize(classifier()(loadSession(ref, { detail: true, env }))).summary;
}
function phaseLine(ctx, transcript, id, options = {}) {
  const source = lineSource(ctx.env, transcript, id);
  if (!source) return void 0;
  const mode = options.mode ?? colorMode(ctx.env);
  const pin = options.pin ?? DEFAULT_PIN;
  return cachedLine(ctx, source, mode, pin, options.cachedOnly ?? false);
}
function cachedLine(ctx, source, mode, pin, cachedOnly) {
  const key = cacheKey(source, mode, pin);
  const file = cachePath(ctx.env, source.id);
  const cached = readCache(file, key);
  if (cached !== void 0 || cachedOnly) return cached;
  const line = renderStatus(statusParts(sessionSummary(ctx.env, source), 3, pin), mode);
  writeCache(file, key, line, ctx.now);
  return line;
}
function statusLine(ctx, input, json, pin) {
  const payload = JSON.parse(input);
  const transcript = payload?.transcript_path;
  if (typeof transcript !== "string") return "";
  const id = typeof payload?.session_id === "string" && payload.session_id ? payload.session_id : path16.basename(transcript, ".jsonl");
  const source = lineSource(ctx.env, transcript, id);
  if (!source) return "";
  if (!json) return cachedLine(ctx, source, colorMode(ctx.env), pin, false) ?? "";
  const summary = sessionSummary(ctx.env, source);
  const parts = statusParts(summary, 3, pin);
  return JSON.stringify(
    {
      id: summary.id,
      sources: summary.sources,
      workingMs: parts.workingMs,
      phases: parts.phases.map((p) => ({
        ...p,
        label: PHASE_LABEL[p.phase],
        name: SHORT_NAME[p.phase]
      })),
      failed: parts.failed,
      reworkMs: parts.reworkMs,
      line: renderStatus(parts, "none")
    },
    null,
    2
  );
}
var statuslineCommand = {
  summary: "One short line for Claude Code's status line: the session's phase split so far",
  usage: `Usage: awf statusline [--pin tests] [--json]

For Claude Code's status line. Reads the JSON Claude Code sends on stdin (session_id,
transcript_path), and prints one line: Running tests, always and first, then the phases that
took the most time so far (three phases in all), then failed lint, test and build runs, and
rework time when it isn't one of the phases shown:

  tests 3% \xB7 build 32% \xB7 scripts 26% \xB7 9 failed \xB7 rework 9s

Shares are of the time the agent worked, without Waiting on you, so they hold still while you're
away. Phases are named code, test code, lint, tests, build, rework, explore, scripts, plan and
unclassified. Colours follow the report; NO_COLOR turns them off.

It never breaks the status line: on any error it prints nothing and exits 0 (AWF_DEBUG=1 prints
the error on stderr). The line is kept in ~/.awf/cache/statusline/ until the transcript, the
recorder's events or a subagent's transcript changes.

Set it up in ~/.claude/settings.json:
  "statusLine": { "type": "command", "command": "awf statusline", "padding": 0 }

  --pin <phases>  the phases always shown, first: ids or short names, comma-separated
                  (default tests; "tests,build"; "none" for only the top three)
  --json          print the phases, failures and rework as JSON (not cached)`,
  options: { json: { type: "boolean" }, pin: { type: "string" } },
  run(ctx, _args, options) {
    let input;
    try {
      input = ctx.io.input?.();
    } catch {
      return 0;
    }
    if (input === void 0) {
      ctx.io.err(
        'awf statusline reads the JSON Claude Code sends on stdin. Run "awf statusline --help".'
      );
      return 0;
    }
    try {
      const pin = parsePin(typeof options.pin === "string" ? options.pin : void 0);
      const line = statusLine(ctx, input, Boolean(options.json), pin);
      if (line) ctx.io.out(line);
    } catch (error) {
      if (ctx.env.AWF_DEBUG)
        ctx.io.err(`awf statusline: ${error instanceof Error ? error.message : String(error)}`);
    }
    return 0;
  }
};

// src/cli/board.ts
var CONTAINERS = /* @__PURE__ */ new Set([
  "Documents",
  "Developer",
  "Projects",
  "projects",
  "Code",
  "code",
  "src",
  "dev",
  "Dev",
  "repos",
  "Repos",
  "git",
  "GitHub",
  "github",
  "workspace",
  "Workspace",
  "work",
  "Work"
]);
var GAP = "   ";
var MAX_PROJECT = 24;
var MAX_TITLE2 = 26;
var MIN_TITLE = 12;
var MIN_LINE = 20;
function projectName(cwd, home) {
  const resolved = path17.resolve(cwd);
  if (!home || resolved !== home && !resolved.startsWith(home + path17.sep)) return resolved;
  const parts = path17.relative(home, resolved).split(path17.sep).filter(Boolean);
  if (parts.length === 0) return "~";
  if (parts.length > 1 && CONTAINERS.has(parts[0])) parts.shift();
  return parts.join("/");
}
var ANSI = /\x1b\[[0-9;?]*[A-Za-z]/g;
var WIDE = /[\u1100-\u115f\u2e80-\u303e\u3041-\u33ff\u3400-\u4dbf\u4e00-\u9fff\ua000-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6\u{1f300}-\u{1f64f}\u{1f900}-\u{1f9ff}\u{20000}-\u{3fffd}]/u;
var ZERO = /[\p{Mn}\p{Me}\p{Cf}]/u;
function charWidth(char) {
  if (ZERO.test(char)) return 0;
  return WIDE.test(char) ? 2 : 1;
}
function textWidth(text) {
  let width = 0;
  for (const char of text.replace(ANSI, "")) width += charWidth(char);
  return width;
}
function truncate(text, width) {
  if (textWidth(text) <= width) return text;
  if (width <= 0) return "";
  let out = "";
  let used = 0;
  let styled = false;
  for (const token of text.split(/(\x1b\[[0-9;?]*[A-Za-z])/)) {
    if (token.startsWith("\x1B[")) {
      out += token;
      styled = true;
      continue;
    }
    for (const char of token) {
      const w = charWidth(char);
      if (used + w > width - 1) return out.trimEnd() + "\u2026" + (styled ? "\x1B[0m" : "");
      out += char;
      used += w;
    }
  }
  return out;
}
function pad2(text, width) {
  return text + " ".repeat(Math.max(0, width - textWidth(text)));
}
var SEPARATOR = / \x1b\[2m·\x1b\[22m | · /;
function fitLine(line, width) {
  if (textWidth(line) <= width) return line;
  const items = line.split(SEPARATOR);
  const separators = line.match(new RegExp(SEPARATOR.source, "g")) ?? [];
  while (items.length > 1) {
    items.pop();
    const joined = items.map((item, i) => i === 0 ? item : separators[i - 1] + item).join("");
    if (textWidth(joined) <= width) return joined;
  }
  return truncate(items[0] ?? "", width);
}
function fitProject(name, width) {
  if (textWidth(name) <= width) return name;
  const parts = name.split("/");
  for (let i = 1; i < parts.length; i++) {
    const tail = "\u2026/" + parts.slice(i).join("/");
    if (textWidth(tail) <= width) return tail;
  }
  return truncate(parts.at(-1) ?? name, width);
}
function style(text, code, mode) {
  if (mode === "none") return text;
  return code === "bold" ? `\x1B[1m${text}\x1B[22m` : `\x1B[2m${text}\x1B[22m`;
}
function paintState(label2, kind, mode) {
  switch (kind) {
    case "approval":
      return style(paint(label2, FAILED_COLOR, mode), "bold", mode);
    case "your-turn":
      return style(label2, "bold", mode);
    case "idle":
      return style(label2, "dim", mode);
    default:
      return label2;
  }
}
function widths(rows, columns) {
  const most = (values) => Math.max(0, ...values.map((v) => textWidth(v ?? "")));
  let project = Math.min(MAX_PROJECT, most(rows.map((r) => r.project)));
  const state = most(rows.map((r) => r.label));
  const fullTitle = Math.min(MAX_TITLE2, most(rows.map((r) => r.title)));
  const fullLine = most(rows.map((r) => r.line));
  if (columns === void 0) return { project, title: fullTitle, state, line: fullLine };
  const gap = GAP.length;
  let room = columns - project - gap - state;
  if (room < 0) {
    project = Math.max(1, project + room);
    room = columns - project - gap - state;
  }
  const shortTitle = Math.min(MIN_TITLE, fullTitle);
  const withTitle = shortTitle > 0 && room >= gap + shortTitle + gap + Math.min(MIN_LINE, fullLine);
  let line = Math.min(fullLine, Math.max(0, room - gap - (withTitle ? gap + shortTitle : 0)));
  if (line < Math.min(MIN_LINE, fullLine)) line = 0;
  const used = line > 0 ? most(rows.map((r) => r.line ? fitLine(r.line, line) : "")) : 0;
  const title = withTitle ? Math.min(fullTitle, room - gap - (used > 0 ? used + gap : 0)) : 0;
  return { project, title, state, line };
}
function renderBoard(header2, rows, layout) {
  const { mode, columns, height } = layout;
  const w = widths(rows, columns);
  let shown = rows;
  let more = 0;
  if (height !== void 0 && rows.length + 1 > height) {
    shown = rows.slice(0, Math.max(0, height - 2));
    more = rows.length - shown.length;
  }
  const lines = shown.map((row) => {
    const cells = [pad2(fitProject(row.project, w.project), w.project)];
    if (w.title > 0) cells.push(pad2(truncate(row.title ?? "", w.title), w.title));
    cells.push(pad2(paintState(row.label, row.state, mode), w.state));
    if (w.line > 0 && row.line) cells.push(fitLine(row.line, w.line));
    return cells.join(GAP).trimEnd();
  });
  if (more > 0) lines.push(style(`\u2026 ${more} more`, "dim", mode));
  const top = style(columns === void 0 ? header2 : truncate(header2, columns), "dim", mode);
  return [top, ...lines].map((l) => columns === void 0 ? l : truncate(l, columns));
}

// src/cli/commands/live.ts
function newMemo() {
  return { facts: /* @__PURE__ */ new Map(), events: /* @__PURE__ */ new Map(), lines: /* @__PURE__ */ new Map() };
}
function readFacts(file, memo) {
  const stamp2 = `${file.size}:${file.mtimeMs}`;
  const known = memo.facts.get(file.path);
  if (known?.stamp === stamp2) return known.facts;
  const facts = transcriptFacts(readFileSync10(file.path, "utf8"));
  memo.facts.set(file.path, { stamp: stamp2, facts });
  return facts;
}
function readSessionEvents(env, id, memo) {
  const file = path18.join(eventsDir(env), `${safeId(id)}.jsonl`);
  const stat2 = statSync7(file, { throwIfNoEntry: false });
  if (!stat2?.isFile()) return void 0;
  const stamp2 = `${stat2.size}:${stat2.mtimeMs}`;
  const known = memo.events.get(file);
  if (known?.stamp === stamp2) return known.events;
  const events = readEvents(file);
  memo.events.set(file, { stamp: stamp2, events });
  return events;
}
function scan(ctx, options, memo, now) {
  const sinceMs = now - options.sinceMs;
  const changed = activeTranscripts(ctx.env, sinceMs);
  const home = ctx.env.HOME || os7.homedir();
  const active = [];
  for (const file of changed) {
    let row;
    try {
      row = readRow(ctx, file, memo, now, home);
    } catch {
      row = void 0;
    }
    if (row && row.activityMs >= sinceMs) active.push(row);
  }
  const rows = active.sort((a, b) => b.activityMs - a.activityMs).slice(0, options.limit);
  const shown = new Set(rows.map((row) => row.id));
  const files2 = new Set(changed.map((file) => file.path));
  for (const file of memo.facts.keys()) if (!files2.has(file)) memo.facts.delete(file);
  for (const id of memo.lines.keys()) if (!shown.has(id)) memo.lines.delete(id);
  for (const file of memo.events.keys())
    if (!shown.has(path18.basename(file, ".jsonl"))) memo.events.delete(file);
  return { rows, total: active.length };
}
function readRow(ctx, file, memo, now, home) {
  const facts = readFacts(file, memo);
  if (facts.lastMs === void 0) return void 0;
  let events;
  try {
    events = readSessionEvents(ctx.env, file.id, memo);
  } catch {
    events = void 0;
  }
  const state = liveState(facts, now, events);
  const row = {
    id: file.id,
    transcript: file.path,
    project: facts.cwd ? projectName(facts.cwd, home) : file.project,
    state,
    label: stateLabel(state, now),
    activityMs: Math.max(facts.lastMs ?? 0, file.subagentsMs ?? 0)
  };
  if (facts.cwd) row.cwd = facts.cwd;
  if (facts.title) row.title = facts.title;
  return row;
}
function fillLine(ctx, row, options, mode, now, cachedOnly) {
  try {
    const line = phaseLine({ env: ctx.env, now }, row.transcript, row.id, {
      pin: options.pin,
      mode,
      cachedOnly
    });
    if (line === void 0) {
      if (cachedOnly) return false;
      row.error = "transcript not found";
      return true;
    }
    row.line = line;
    delete row.error;
    return true;
  } catch (error) {
    row.error = error instanceof Error ? error.message : String(error);
    delete row.line;
    return true;
  }
}
function clock(ms) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function every(ms) {
  return ms % 6e4 === 0 ? `${ms / 6e4}m` : `${Math.round(ms / 1e3)}s`;
}
function header(total, shown, options, now, live) {
  const count2 = total === 0 ? `nothing active in the last ${options.since}` : shown < total ? `${total} active, ${shown} shown` : `${total} active`;
  return ["awf live", count2, ...live ? [`every ${every(options.everyMs)}`] : [], clock(now)].join(
    " \xB7 "
  );
}
function boardRows(rows) {
  return rows.map((row) => {
    const board = { project: row.project, label: row.label, state: row.state.kind };
    if (row.title) board.title = row.title;
    if (row.line) board.line = row.line;
    return board;
  });
}
var ANSI2 = /\x1b\[[0-9;]*m/g;
function jsonRow(row) {
  return {
    id: row.id,
    project: row.project,
    cwd: row.cwd,
    title: row.title,
    state: row.state.kind,
    label: row.label,
    ...row.state.sinceMs !== void 0 ? { sinceMs: row.state.sinceMs } : {},
    ...row.state.question ? { question: row.state.question } : {},
    background: row.state.background,
    servers: row.state.servers,
    activityMs: row.activityMs,
    line: row.line?.replace(ANSI2, ""),
    ...row.error ? { error: row.error } : {},
    transcript: row.transcript
  };
}
var SHOW_CURSOR = "\x1B[?25h";
var HIDE_CURSOR = "\x1B[?25l";
var processTerminal = {
  get isTTY() {
    return Boolean(process.stdout.isTTY);
  },
  // A terminal that reports no size (0) has none to fit.
  get columns() {
    return process.stdout.isTTY && process.stdout.columns || void 0;
  },
  get rows() {
    return process.stdout.isTTY && process.stdout.rows || void 0;
  },
  write: (text) => process.stdout.write(text),
  onResize(listener) {
    process.stdout.on("resize", listener);
    return () => process.stdout.off("resize", listener);
  },
  onStop(listener) {
    const signals = ["SIGINT", "SIGTERM", "SIGHUP"];
    for (const signal of signals) process.on(signal, listener);
    const restore = () => process.stdout.write(SHOW_CURSOR);
    process.on("exit", restore);
    return () => {
      for (const signal of signals) process.off(signal, listener);
      process.off("exit", restore);
    };
  }
};
function columnsOf(env, terminal, live) {
  const fromEnv = Number(env.COLUMNS);
  const set = Number.isInteger(fromEnv) && fromEnv > 0 ? fromEnv : void 0;
  return live ? terminal.columns ?? set : set ?? terminal.columns;
}
function onePass(ctx, options, mode) {
  const memo = newMemo();
  const pass = scan(ctx, options, memo, ctx.now);
  for (const row of pass.rows) {
    fillLine(ctx, row, options, mode, ctx.now, false);
    if (row.error && ctx.env.AWF_DEBUG) ctx.io.err(`awf live: ${row.id}: ${row.error}`);
  }
  return pass;
}
function liveLoop(ctx, options, terminal, now = Date.now) {
  const mode = colorMode(ctx.env);
  const memo = newMemo();
  let frame;
  let stopped = false;
  let timer;
  const draw = () => {
    if (!frame || stopped) return;
    const lines = renderBoard(frame.header, boardRows(frame.rows), {
      mode,
      columns: columnsOf(ctx.env, terminal, true),
      height: terminal.rows
    });
    terminal.write("\x1B[H" + lines.map((line) => line + "\x1B[K").join("\n") + "\x1B[J");
  };
  return new Promise((resolve2) => {
    const stop = () => {
      if (stopped) return;
      stopped = true;
      if (timer) clearTimeout(timer);
      offResize();
      offStop();
      terminal.write("\n" + SHOW_CURSOR);
      resolve2(0);
    };
    const offStop = terminal.onStop(stop);
    const offResize = terminal.onResize(draw);
    terminal.write(HIDE_CURSOR + "\x1B[H\x1B[2J");
    const pass = async () => {
      const started = now();
      try {
        const { rows, total } = scan(ctx, options, memo, started);
        const stale = [];
        for (const row of rows) {
          if (fillLine(ctx, row, options, mode, started, true)) continue;
          const last = memo.lines.get(row.id);
          if (last !== void 0) row.line = last;
          stale.push(row);
        }
        frame = { header: header(total, rows.length, options, started, true), rows };
        draw();
        for (const row of stale) {
          await new Promise((next) => setImmediate(next));
          if (stopped) return;
          fillLine(ctx, row, options, mode, started, false);
          if (row.line !== void 0) memo.lines.set(row.id, row.line);
          draw();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        frame = { header: `awf live \xB7 ${message} \xB7 ${clock(started)}`, rows: [] };
        draw();
      }
      if (stopped) return;
      timer = setTimeout(pass, Math.max(1e3, options.everyMs - (now() - started)));
    };
    void pass();
  });
}
function parseEvery(value) {
  const match = /^(\d+(?:\.\d+)?)\s*(s|m)?$/.exec(value.trim());
  if (!match) throw new Error(`can't read --every "${value}": use seconds, like 20 or 20s, or 1m`);
  const ms = Number(match[1]) * (match[2] === "m" ? 6e4 : 1e3);
  if (ms < 1e3) throw new Error("--every is at least 1s");
  return ms;
}
function liveOptions(options) {
  const since = typeof options.since === "string" ? options.since : "2h";
  const limit = typeof options.limit === "string" ? Number(options.limit) : 10;
  if (!Number.isInteger(limit) || limit < 1)
    throw new Error(`--limit is a whole number of sessions, like 10`);
  return {
    since,
    sinceMs: parseSince(since),
    limit,
    everyMs: typeof options.every === "string" ? parseEvery(options.every) : 2e4,
    pin: parsePin(typeof options.pin === "string" ? options.pin : void 0)
  };
}
var liveCommand = {
  summary: "A board of every active Claude Code session: project, task, state and phase split",
  usage: `Usage: awf live [--since 2h] [--limit 10] [--every 20s] [--pin tests] [--once] [--json]

A board for a spare terminal tab: every Claude Code session active recently (its last entry, or a
subagent's transcript changing), newest activity first, redrawn in place until Ctrl-C. It reads
the transcripts, so it shows sessions of the desktop app too, where the status line never shows.

  acme-billing/web   CI pipeline for demo-000\u2026   working     tests 35% \xB7 build 33% \xB7 explore 12%
  deploys            Cache key rollout\u2026          your turn   tests 4% \xB7 scripts 57% \xB7 rework 14m

Each row: the session's folder, its title or first prompt, its state, and the status line's
phase split (see "awf statusline --help"). The state, from the end of the transcript:
  working     a turn is under way (a model or tool call open), or background tasks or
              subagents it started are still running; a server left running (pnpm dev,
              next dev, PORT=8080 ./api) doesn't count, since nothing waits for it to end
  approval?   a permission prompt is waiting; only known when the awf plugin recorded the session
  your turn   the turn ended, or a question waits for your answer
  idle 12m    your turn for 5 minutes or more
Without the plugin a call waiting for your approval reads as working. When the session's
process exits, what it was running ends with it: your turn.

Phase lines are kept in ~/.awf/cache/statusline/ with the status line's, so a pass reads only
sessions that changed. Colours follow the status line; NO_COLOR turns them off.

  --since <age>    sessions active this recently (default 2h; 30m, 1d)
  --limit <n>      at most this many sessions (default 10)
  --every <time>   redraw this often (default 20s; 5s, 1m)
  --pin <phases>   the phases always shown, first, as in "awf statusline" (default tests)
  --once           print one pass and exit (also when output isn't a terminal)
  --json           print one pass as JSON`,
  options: {
    since: { type: "string" },
    limit: { type: "string" },
    every: { type: "string" },
    pin: { type: "string" },
    once: { type: "boolean" },
    json: { type: "boolean" }
  },
  run(ctx, _args, options) {
    const live = liveOptions(options);
    const mode = colorMode(ctx.env);
    if (options.json) {
      const { rows } = onePass(ctx, live, mode);
      ctx.io.out(JSON.stringify(rows.map(jsonRow), null, 2));
      return 0;
    }
    const terminal = processTerminal;
    if (options.once || !terminal.isTTY) {
      const { rows, total } = onePass(ctx, live, mode);
      const lines = renderBoard(header(total, rows.length, live, ctx.now, false), boardRows(rows), {
        mode,
        columns: columnsOf(ctx.env, terminal, false)
      });
      ctx.io.out(lines.join("\n"));
      return 0;
    }
    return liveLoop(ctx, live, terminal);
  }
};

// src/cli/commands/purge.ts
import { existsSync as existsSync9, readdirSync as readdirSync9, rmSync as rmSync2, statSync as statSync8 } from "node:fs";
import os8 from "node:os";
import path19 from "node:path";
var OURS = /* @__PURE__ */ new Set(["events", "imported", "reports", "cache", ".DS_Store"]);
function size(target) {
  const stat2 = statSync8(target, { throwIfNoEntry: false });
  if (!stat2) return 0;
  if (!stat2.isDirectory()) return stat2.size;
  return readdirSync9(target).reduce((n, name) => n + size(path19.join(target, name)), 0);
}
function human(bytes) {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(0)} kB`;
  return `${bytes} B`;
}
var purgeCommand = {
  summary: "Delete everything awf stored (~/.awf); Claude Code's own files stay",
  usage: `Usage: awf purge [--yes] [--json]

Deletes awf's folder (~/.awf, or $AWF_HOME): recorded timings, the import cache, reports and the
status line's cache.
Claude Code's transcripts are never touched. Without --yes it only lists what it would delete.
  --yes    delete it
  --json   print the folder's contents as JSON (it still deletes only with --yes)`,
  options: { yes: { type: "boolean" }, json: { type: "boolean" } },
  run(ctx, _args, options) {
    const home = ctx.env.HOME ?? os8.homedir();
    const dir = awfHome(ctx.env);
    const shown = homeRelative(dir, home);
    if (!existsSync9(dir)) {
      if (options.json) {
        ctx.io.out(JSON.stringify({ dir, parts: [], foreign: [], deleted: false }, null, 2));
      } else {
        ctx.io.out(`Nothing to delete: ${shown} doesn't exist.`);
      }
      return 0;
    }
    const entries2 = readdirSync9(dir);
    const foreign = entries2.filter((name) => !OURS.has(name));
    const parts = entries2.filter((name) => OURS.has(name) && name !== ".DS_Store").map((name) => ({ name, bytes: size(path19.join(dir, name)) }));
    const report = (deleted) => ctx.io.out(JSON.stringify({ dir, parts, foreign, deleted }, null, 2));
    if (options.json && !options.yes) {
      report(false);
      return 0;
    }
    if (foreign.length) {
      ctx.io.err(
        `${shown} holds files awf didn't make (${foreign.slice(0, 5).join(", ")}${foreign.length > 5 ? ", \u2026" : ""}), so awf won't delete it. Remove them first, or delete the folder yourself.`
      );
      return 1;
    }
    if (!options.yes) {
      ctx.io.out(`Would delete ${shown}:`);
      for (const part of parts) ctx.io.out(`  ${part.name.padEnd(9)} ${human(part.bytes)}`);
      ctx.io.out(`Run "awf purge --yes" to delete it. Claude Code's transcripts are not touched.`);
      return 0;
    }
    rmSync2(dir, { recursive: true, force: true });
    if (options.json) report(true);
    else ctx.io.out(`Deleted ${shown}.`);
    return 0;
  }
};

// src/cli/commands/report.ts
import { spawn } from "node:child_process";
import { mkdirSync as mkdirSync3, writeFileSync as writeFileSync3 } from "node:fs";
import os9 from "node:os";
import path21 from "node:path";
import { pathToFileURL } from "node:url";

// src/build/drilldown.ts
import { readdirSync as readdirSync10, readFileSync as readFileSync11 } from "node:fs";
import path20 from "node:path";
import { gunzipSync } from "node:zlib";

// src/build/parsers.ts
var bySlowest = (tasks) => tasks.sort((a, b) => b.ms - a.ms);
function parseCargoTimings(html) {
  const start = /Build start:<\/td>\s*<td>([^<]+)</.exec(html)?.[1];
  const startMs = start ? Date.parse(start) : NaN;
  const data = /const UNIT_DATA = (\[[\s\S]*?\]);\s*\n\s*const /.exec(html)?.[1];
  if (!data) return { tasks: [] };
  let units;
  try {
    units = JSON.parse(data);
  } catch {
    return { tasks: [] };
  }
  const tasks = units.filter((u) => typeof u.duration === "number" && u.name).map((u) => {
    const target = (u.target ?? "").trim();
    const task = {
      name: `${u.name} v${u.version ?? ""}${target ? ` (${target.replace(/"/g, "")})` : ""}`,
      ms: Math.round((u.duration ?? 0) * 1e3)
    };
    if (Number.isFinite(startMs) && typeof u.start === "number")
      task.startMs = startMs + Math.round(u.start * 1e3);
    return task;
  });
  return { ...Number.isFinite(startMs) ? { startMs } : {}, tasks: bySlowest(tasks) };
}
function parseXcodeTimingSummary(output) {
  const at = output.lastIndexOf("Build Timing Summary");
  if (at < 0) return [];
  const tasks = [];
  for (const match of output.slice(at).matchAll(/^(\S.*?) \((\d+) tasks?\) \| ([\d.]+) seconds$/gm)) {
    tasks.push({
      name: match[1],
      count: Number(match[2]),
      ms: Math.round(Number(match[3]) * 1e3)
    });
  }
  return bySlowest(tasks);
}
function gradleDuration(text) {
  const match = /^(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:([\d.]+)s)$/.exec(text.trim());
  if (!match) return void 0;
  const [, d = "0", h = "0", m = "0", s = "0"] = match;
  return Math.round(((Number(d) * 24 + Number(h)) * 60 + Number(m)) * 6e4 + Number(s) * 1e3);
}
function parseGradleProfile(html) {
  const at = html.indexOf("<h2>Task Execution</h2>");
  if (at < 0) return [];
  const section = html.slice(at, html.indexOf("</table>", at) + 8);
  const tasks = [];
  for (const row of section.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const cells = [...(row[1] ?? "").matchAll(/<td[^>]*?(?:\/>|>([\s\S]*?)<\/td>)/g)].map(
      (c) => (c[1] ?? "").replace(/<[^>]+>/g, "").trim()
    );
    const [name, duration, result2 = ""] = cells;
    if (!name || !duration || result2 === "(total)") continue;
    const ms = gradleDuration(duration);
    if (ms === void 0) continue;
    tasks.push({ name, ms, ...result2 ? { result: result2 } : {} });
  }
  return bySlowest(tasks);
}
function gradleProfileTime(file) {
  const m = /profile-(\d{4})-(\d\d)-(\d\d)-(\d\d)-(\d\d)-(\d\d)\.html$/.exec(file);
  if (!m) return void 0;
  const [, y, mo, d, h, mi, s] = m.map(Number);
  return new Date(y, mo - 1, d, h, mi, s).getTime();
}
function cargoTimingTime(file) {
  const m = /cargo-timing-(\d{4})(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d)(?:\.(\d+))?Z\.html$/.exec(file);
  if (!m) return void 0;
  const [, y, mo, d, h, mi, s] = m.map(Number);
  return Date.UTC(y, mo - 1, d, h, mi, s) + Math.round(Number(`0.${m[7] ?? "0"}`) * 1e3);
}
function parseBazelProfile(json, startMs) {
  let trace;
  try {
    trace = JSON.parse(json);
  } catch {
    return [];
  }
  const tasks = [];
  for (const e of trace.traceEvents ?? []) {
    if (e.ph !== "X" || typeof e.dur !== "number" || typeof e.ts !== "number" || !e.name) continue;
    if (e.cat !== "action processing") continue;
    tasks.push({
      name: e.name,
      ms: Math.round(e.dur / 1e3),
      startMs: startMs + Math.round(e.ts / 1e3)
    });
  }
  return bySlowest(tasks);
}
function parseMsbuildSummary(output) {
  const at = output.lastIndexOf("Target Performance Summary:");
  if (at < 0) return [];
  const tasks = [];
  for (const line of output.slice(at).split("\n").slice(1)) {
    const match = /^\s*(\d+) ms\s+(.+?)\s+(\d+) calls?\s*$/.exec(line);
    if (!match) {
      if (line.trim() === "" || /Performance Summary:/.test(line)) {
        if (tasks.length > 0) break;
        continue;
      }
      continue;
    }
    tasks.push({ name: match[2], ms: Number(match[1]), count: Number(match[3]) });
  }
  return bySlowest(tasks);
}

// src/build/drilldown.ts
var diskBuildFiles = {
  read(file) {
    try {
      const bytes = readFileSync11(file);
      return file.endsWith(".gz") ? gunzipSync(bytes).toString("utf8") : bytes.toString("utf8");
    } catch {
      return void 0;
    }
  },
  list(dir) {
    try {
      return readdirSync10(dir);
    } catch {
      return [];
    }
  }
};
var WINDOW_MS = 1e4;
var MAX_TASKS = 12;
function attachBuildTimings(session, files2 = diskBuildFiles) {
  let found = 0;
  for (const step of session.steps) {
    if (step.kind !== "tool" || !step.command) continue;
    const timings = timingsFor(step, session.cwd, files2);
    if (!timings || timings.tasks.length === 0) continue;
    step.build = {
      ...timings,
      tasks: timings.tasks.slice(0, MAX_TASKS),
      total: timings.tasks.length
    };
    found++;
  }
  return found;
}
function optionValue2(args, names) {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (names.includes(arg)) return args[i + 1];
    const eq = names.find((n) => arg.startsWith(`${n}=`));
    if (eq) return arg.slice(eq.length + 1);
  }
  return void 0;
}
function nearest(files2, dir, timeOf, step) {
  let best;
  let distance = Infinity;
  for (const name of files2.list(dir)) {
    const t = timeOf(name);
    if (t === void 0 || t < step.startMs - WINDOW_MS || t > step.endMs + WINDOW_MS) continue;
    if (Math.abs(t - step.startMs) < distance) {
      best = path20.join(dir, name);
      distance = Math.abs(t - step.startMs);
    }
  }
  return best;
}
function timingsFor(step, sessionCwd, files2) {
  const output = step.detail?.output ?? "";
  for (const simple of splitCommand(step.command ?? "")) {
    const argv = unwrap(simple.argv).argv;
    const program = programName(argv[0] ?? "");
    const args = argv.slice(1);
    const cwd = simple.cd.reduce((dir, target) => resolvePath(dir, target), sessionCwd ?? "/");
    switch (program) {
      case "xcodebuild": {
        if (!args.includes("-showBuildTimingSummary")) break;
        const tasks = parseXcodeTimingSummary(output);
        if (tasks.length) return { tool: "xcodebuild", source: "output", tasks };
        break;
      }
      case "msbuild":
      case "MSBuild":
      case "dotnet": {
        const tasks = parseMsbuildSummary(output);
        if (tasks.length) return { tool: "msbuild", source: "output", tasks };
        break;
      }
      case "cargo":
      case "cross": {
        if (!args.some((a) => a === "--timings" || a.startsWith("--timings="))) break;
        const manifest = optionValue2(args, ["--manifest-path"]);
        const root = manifest ? path20.dirname(resolvePath(cwd, manifest)) : cwd;
        const file = /Timing report saved to (\S+\.html)/.exec(output)?.[1] ?? nearest(files2, path20.join(root, "target", "cargo-timings"), cargoTimingTime, step);
        const html = file ? files2.read(file) : void 0;
        if (file && html)
          return { tool: "cargo", source: file, tasks: parseCargoTimings(html).tasks };
        break;
      }
      case "gradle": {
        if (!args.includes("--profile")) break;
        const project = optionValue2(args, ["-p", "--project-dir"]);
        const root = project ? resolvePath(cwd, project) : cwd;
        const file = /See the profiling report at: file:\/\/(\S+\.html)/.exec(output)?.[1] ?? nearest(files2, path20.join(root, "build", "reports", "profile"), gradleProfileTime, step);
        const html = file ? files2.read(decodeURI(file)) : void 0;
        if (file && html)
          return { tool: "gradle", source: decodeURI(file), tasks: parseGradleProfile(html) };
        break;
      }
      case "bazel":
      case "bazelisk": {
        const flag = optionValue2(args, ["--profile"]);
        if (!flag) break;
        const file = resolvePath(cwd, flag);
        const text = files2.read(file);
        if (text)
          return { tool: "bazel", source: file, tasks: parseBazelProfile(text, step.startMs) };
        break;
      }
    }
  }
  return void 0;
}

// src/report/data.ts
var MAX_OUTPUT_STEP = 4e3;
var MAX_OUTPUT_TOTAL = 25e5;
function shareCheck(key) {
  return key.replace(/:(npm|pnpm|yarn|bun|deno|make) .*/, ":$1");
}
function stepLabel(step, turnNumber, share) {
  switch (step.kind) {
    case "turn":
      return `Turn ${turnNumber.get(step.id) ?? ""}`.trim();
    case "subagent":
      return step.agentType ? `Subagent \xB7 ${step.agentType}` : "Subagent";
    case "model":
      return "Model";
    case "idle":
      return "Idle";
    case "compact":
      return "Compacting context";
    case "background":
      return "Background";
    default:
      if (step.tool?.startsWith("mcp__")) {
        const [, id = "", ...name] = step.tool.split("__");
        const server = /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id) ? `${id.slice(0, 8)}\u2026` : id;
        return share ? server : [server, ...name].join(" \xB7 ");
      }
      return step.tool ?? "Tool";
  }
}
function shortPath(file, cwd, home) {
  if (cwd && (file === cwd || file.startsWith(cwd + "/"))) return file.slice(cwd.length + 1) || ".";
  if (home && file.startsWith(home + "/")) return "~" + file.slice(home.length);
  return file;
}
function head(command) {
  const argv = splitCommand(command).map((c) => unwrap(c.argv).argv).find(
    (a) => a.length > 0 && !["cd", "export", "echo", "set", "source"].includes(programName(a[0] ?? ""))
  );
  return argv ? programName(argv[0] ?? "") : "shell";
}
function buildReportData(analysis, options = {}) {
  const { session, summary } = analysis;
  const share = options.share ?? false;
  const t0 = session.startMs;
  const byId = new Map(session.steps.map((s) => [s.id, s]));
  const children = /* @__PURE__ */ new Map();
  for (const step of session.steps) {
    const parent = step.parentId && byId.has(step.parentId) ? step.parentId : null;
    children.set(parent, [...children.get(parent) ?? [], step]);
  }
  for (const list3 of children.values())
    list3.sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
  const turnNumber = /* @__PURE__ */ new Map();
  for (const step of session.steps.filter((s) => s.kind === "turn").sort((a, b) => a.startMs - b.startMs)) {
    turnNumber.set(step.id, turnNumber.size + 1);
  }
  const steps = [];
  const displayIndex = /* @__PURE__ */ new Map();
  let outputBudget = MAX_OUTPUT_TOTAL;
  const visit = (step, parent, depth) => {
    const i = steps.length;
    const kids = children.get(step.id) ?? [];
    const out = {
      i,
      p: parent,
      depth,
      kind: step.kind,
      s: step.startMs - t0,
      e: step.endMs - t0,
      label: stepLabel(step, turnNumber, share),
      failed: step.failed,
      flags: step.flags,
      tags: share ? step.tags.filter((t) => !/^(script|make|task|file|hook|via|unmatched):/.test(t)) : step.tags,
      checks: step.checks.map((c) => ({
        key: share ? shareCheck(c.key) : c.key,
        failed: c.failed
      })),
      container: kids.length > 0
    };
    if (step.phase) out.phase = step.phase;
    if (step.tool)
      out.tool = step.tool.startsWith("mcp__") && share ? `mcp__${step.tool.split("__")[1] ?? ""}` : step.tool;
    if (step.ok !== void 0) out.ok = step.ok;
    if (step.reworkFor) out.reworkFor = share ? shareCheck(step.reworkFor) : step.reworkFor;
    if (step.runMs !== void 0) out.runMs = step.runMs;
    if (step.waitMs !== void 0) out.waitMs = step.waitMs;
    if (step.exitCode !== void 0) out.exitCode = step.exitCode;
    if (step.model) out.model = step.model;
    if (step.tokens) out.tokens = step.tokens;
    if (step.agentType) out.agentType = step.agentType;
    if (step.kind === "model" && step.produces?.length) {
      const produced = step.produces.map((id) => byId.get(id)).filter((s) => !!s);
      out.text = "\u2192 " + produced.map((s) => stepLabel(s, turnNumber, share)).join(", ");
    }
    if (!share) {
      if (step.command) out.text = step.command;
      else if (step.files?.length && step.kind === "tool")
        out.text = step.files.map((f) => shortPath(f, session.cwd, options.home)).join(" ");
      if (step.files?.length)
        out.files = step.files.map((f) => shortPath(f, session.cwd, options.home));
      if (step.detail?.description) out.description = step.detail.description;
      if (step.detail?.output && outputBudget > 0) {
        const text = maskSecrets(step.detail.output).slice(0, MAX_OUTPUT_STEP);
        out.output = text;
        outputBudget -= text.length;
      }
    }
    steps.push(out);
    displayIndex.set(step.id, i);
    if (step.build && !share) {
      out.container = true;
      out.description = `Slowest ${step.build.tasks.length} of ${step.build.total} tasks, from ${step.build.source === "output" ? `${step.build.tool}'s output` : shortPath(step.build.source, session.cwd, options.home)}`;
      for (const task of step.build.tasks) {
        const started = task.startMs !== void 0;
        const s0 = started ? task.startMs - t0 : step.startMs - t0;
        steps.push({
          i: steps.length,
          p: i,
          depth: depth + 1,
          kind: "build-task",
          ...step.phase ? { phase: step.phase } : {},
          s: s0,
          e: s0 + task.ms,
          label: task.name,
          ...task.count && task.count > 1 ? { text: `${task.count} ${step.build.tool === "msbuild" ? "calls" : "tasks"}` } : task.result ? { text: task.result } : {},
          tool: step.build.tool,
          failed: false,
          flags: [],
          tags: [],
          checks: [],
          container: false,
          started
        });
      }
    }
    for (const kid of kids) visit(kid, i, depth + 1);
  };
  for (const top of children.get(null) ?? []) visit(top, -1, 0);
  for (const step of session.steps) {
    const target = displayIndex.get(step.id);
    if (step.kind !== "model" || !step.produces?.length || target === void 0) continue;
    const made = step.produces.map((id) => displayIndex.get(id)).filter((i) => i !== void 0);
    if (made.length) steps[target].produces = made;
  }
  const leaves = steps.filter(
    (s) => (!s.container || steps[s.i + 1]?.kind === "build-task") && s.kind !== "build-task" && s.kind !== "idle" && s.kind !== "turn" && s.kind !== "background" && !s.flags.includes("background")
  );
  const slowest = [...leaves].sort((a, b) => b.e - b.s - (a.e - a.s)).slice(0, 3).map((s) => s.i);
  const MODEL = "\0model";
  const unclassifiedName = (step) => {
    if (step.kind === "compact") return "compaction";
    if (step.kind === "model") return MODEL;
    if (step.command && !share) return head(step.command);
    if (step.tool?.startsWith("mcp__")) return stepLabel(step, turnNumber, share);
    return step.tool ?? step.kind;
  };
  const segments = phaseSegments(session);
  const owners = session.steps.filter((s) => s.phase === "unclassified" && s.kind !== "turn" && s.endMs > s.startMs).sort((a, b) => a.startMs - b.startMs);
  const unclassified = /* @__PURE__ */ new Map();
  const add = (name, ms) => unclassified.set(name, (unclassified.get(name) ?? 0) + ms);
  for (const segment of segments) {
    if (segment.phase !== "unclassified") continue;
    if (!segment.covered) {
      add("time between steps", segment.end - segment.start);
      continue;
    }
    const running = owners.filter((o) => o.startMs < segment.end && o.endMs > segment.start);
    const cuts = [
      .../* @__PURE__ */ new Set([
        segment.start,
        segment.end,
        ...running.flatMap((o) => [o.startMs, o.endMs]).filter((t) => t > segment.start && t < segment.end)
      ])
    ].sort((a, b) => a - b);
    for (let k = 0; k + 1 < cuts.length; k++) {
      const a = cuts[k];
      const b = cuts[k + 1];
      let owner;
      for (const step of running) {
        if (step.startMs >= b || step.endMs <= a) continue;
        const background = step.kind === "background" || step.flags.includes("background");
        const ownerBackground = owner && (owner.kind === "background" || owner.flags.includes("background"));
        if (!owner || ownerBackground && !background || ownerBackground === background && step.startMs >= owner.startMs)
          owner = step;
      }
      add(owner ? unclassifiedName(owner) : "time between steps", b - a);
    }
  }
  const data = {
    v: 1,
    generatedAt: options.now ?? Date.now(),
    share,
    session: {
      id: share ? session.id.slice(0, 8) : session.id,
      agent: session.agent,
      sources: session.sources,
      startMs: t0,
      totalMs: summary.totalMs,
      turnsMs: summary.turnsMs,
      awayWorkMs: summary.awayWorkMs
    },
    phases: summary.phases.map((p) => ({
      id: p.phase,
      label: p.label,
      ms: p.ms,
      share: p.share,
      detail: phaseDetail(p)
    })),
    counts: {
      modelCalls: summary.modelCalls,
      toolCalls: summary.toolCalls,
      subagents: summary.subagents,
      failures: summary.failures,
      reworkLoops: summary.rework.filter((w) => w.edits > 0).length
    },
    rework: summary.rework.map((w) => ({
      check: share ? shareCheck(w.check) : w.check,
      failedAt: w.failedAtMs - t0,
      ...w.passedAtMs !== void 0 ? { passedAt: w.passedAtMs - t0 } : {},
      edits: w.edits
    })),
    steps,
    slowest,
    unclassified: [...unclassified].filter(([name]) => name !== MODEL).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, ms]) => ({ name, ms })),
    unclassifiedModelMs: unclassified.get(MODEL) ?? 0,
    timeline: segments.map((g) => [g.start - t0, g.end - t0, g.phase])
  };
  if (session.agentVersion) data.session.agentVersion = session.agentVersion;
  if (!share && session.title) data.session.title = session.title;
  if (!share && session.cwd) data.session.cwd = shortPath(session.cwd, void 0, options.home);
  if (summary.tokens) data.tokens = summary.tokens;
  return data;
}

// report-assets:report-assets
var CLIENT_JS = '"use strict";(()=>{function u(e){if(!Number.isFinite(e)||e<0)return"\\u2013";if(e<1e3)return`${Math.round(e)} ms`;if(e<1e4)return`${(e/1e3).toFixed(1)}s`;let t=Math.round(e/1e3),s=Math.floor(t/3600),a=Math.floor(t%3600/60),o=t%60;return s>0?`${s}h ${fe(a)}m ${fe(o)}s`:a>0?`${a}m ${fe(o)}s`:`${o}s`}function fe(e){return String(e).padStart(2,"0")}var Ce="0.1.0";var Qe=performance.now(),c=JSON.parse(document.getElementById("awf-data")?.textContent??"null"),b=c.steps,$=Math.max(1,c.session.totalMs),ie=b.map(()=>[]);for(let e of b)e.p>=0&&ie[e.p]?.push(e.i);var Ie=new Map(c.phases.map(e=>[e.id,e.label])),Ze=new Map(c.slowest.map((e,t)=>[e,t])),me=b.filter(e=>!e.container).length;function n(e,t={},...s){let a=document.createElement(e);for(let[o,i]of Object.entries(t))i===void 0||i===!1||(o==="class"?a.className=String(i):o==="text"?a.textContent=String(i):a.setAttribute(o,i===!0?"":String(i)));for(let o of s)o&&a.append(o);return a}var M=e=>String(e).padStart(2,"0"),j=e=>e.replace(/\\s+/g," ").trim(),V=(e,t)=>e.length>t?e.slice(0,t-1)+"\\u2026":e,P=(e,t,s=`${t}s`)=>`${e.toLocaleString("en-US")} ${e===1?t:s}`,_=e=>`var(--c-${e})`,H=e=>e?Ie.get(e)??e:"",T=e=>e.e-e.s;function E(e){return e>0&&e<.005?"<1%":`${Math.round(e*100)}%`}function S(e,t=!0){let s=Math.max(0,Math.round(e/1e3)),a=Math.floor(s/3600),o=Math.floor(s%3600/60);return $>=36e5?`${a}:${M(o)}${t?`:${M(s%60)}`:""}`:`${Math.floor(s/60)}:${M(s%60)}`}function xe(e,t=!1){let s=new Date(e),a=`${M(s.getHours())}:${M(s.getMinutes())}:${M(s.getSeconds())}`;return t?`${s.getFullYear()}-${M(s.getMonth()+1)}-${M(s.getDate())} ${a.slice(0,5)}`:a}function K(e){return e>=1e6?`${(e/1e6).toFixed(e>=1e7?0:1)}M`:e>=1e3?`${(e/1e3).toFixed(e>=1e4?0:1)}k`:String(e)}function D(e){if(e.text)return e.text;if(e.description)return e.description;if(e.kind==="turn"&&e.flags.includes("notification"))return"started by a notice, not a prompt"}var et=[...[1,2,5,10,15,30].map(e=>e*1e3),...[1,2,5,10,15,30].map(e=>e*6e4),...[1,2,3,6,12,24].map(e=>e*36e5)];function tt(){let e=b.filter(o=>o.kind!=="idle"&&o.e>o.s).map(o=>[o.s,o.e]).sort((o,i)=>o[0]-i[0]),t=Math.max(6e4,$*.03),s=[],a=0;for(let[o,i]of e)o-a>=t&&s.push({s:a,e:o}),a=Math.max(a,i);return $-a>=t&&s.push({s:a,e:$}),s}var ke=tt();function Re(e){let t=e?ke:[],s=t.reduce((x,h)=>x+h.e-h.s,0),a=$-s,o=t.length&&a>0?Math.min(1.5,12/t.length):0,i=o?t:[],d=(100-i.length*o)/(o?a:$),p=[[0,0]],m=[],f=0,w=0;for(let x of i)f+=(x.s-w)*d,p.push([x.s,f]),m.push({s:x.s,e:x.e,x0:f,x1:f+o}),f+=o,p.push([x.e,f]),w=x.e;return p.push([$,100]),{x:x=>{if(x<=0)return 0;if(x>=$)return 100;let h=0,I=p.length-1;for(;I-h>1;){let pe=h+I>>1;p[pe][0]<=x?h=pe:I=pe}let[de,ue]=p[h],[ve,Je]=p[I];return ve===de?ue:ue+(x-de)/(ve-de)*(Je-ue)},gaps:m,k:d}}function nt(e){let t=Math.round(e/6e4);return t>=60?`${Math.floor(t/60)}h ${M(t%60)}m`:t>=1?`${t}m`:`${Math.round(e/1e3)}s`}var Pe=e=>`${nt(e.e-e.s)} idle`;function st(e){let t=d=>{let p=(be(d)+22)/Math.max(e,1)*100,m=p/g.k,f=et.find(w=>w>=m)??Math.ceil(m/864e5)*864e5;return{minPct:p,step:f}},{minPct:s,step:a}=t($>=36e5?"0:00":"00:00");$>=36e5&&a<6e4&&({minPct:s,step:a}=t("0:00:00"));let o=[],i=-1/0;for(let d=0;d<=$;d+=a){if(g.gaps.some(f=>d>f.s&&d<f.e))continue;let p=g.x(d);if(p-i<s)continue;let m=g.gaps.some(f=>{let w=(be(Pe(f))/2+12)/Math.max(e,1)*100;return Math.abs(p-(f.x0+f.x1)/2)<w+s/2});d>0&&m||(o.push({x:p,text:S(d,a<6e4)}),i=p)}let r=$>=36e5?a<6e4?"h:mm:ss":"h:mm":"m:ss";return{ticks:o,unit:r}}var l={collapsed:new Set,filterCollapsed:new Set,phases:new Set,failedOnly:!1,query:"",open:-1,focus:-1,squeeze:ke.length>0};for(let e of b)e.container&&(e.kind==="subagent"||me>250&&e.kind==="turn")&&l.collapsed.add(e.i);var g=Re(l.squeeze),v=()=>l.phases.size>0||l.failedOnly||l.query!=="";function _e(e){return!(l.phases.size>0&&!(e.phase&&l.phases.has(e.phase))||l.failedOnly&&!e.failed||l.query&&![e.label,e.text,e.tool,e.agentType,e.description,...e.checks.map(s=>s.key)].filter(Boolean).join(`\n`).toLowerCase().includes(l.query))}function He(){let e=v(),t,s=new Set;if(e){t=new Set;for(let r of b)if(_e(r)){t.add(r.i);for(let d=r.p;d>=0&&!s.has(d);d=b[d]?.p??-1)t.add(d),s.add(d)}}else for(let r of b)r.container&&s.add(r.i);let a=e?l.filterCollapsed:l.collapsed,o=[],i=1/0;for(let r of b)r.depth>i||(i=1/0,!(t&&!t.has(r.i))&&(o.push(r),s.has(r.i)&&a.has(r.i)&&(i=r.depth)));return{rows:o,parents:s}}var k=He(),at=document.getElementById("app"),G=n("div",{class:"wrap"});at.append(G);var L=c.session.totalMs,W=c.session.turnsMs,U=c.session.awayWorkMs,ot=Math.max(0,L-W-U),it=c.share?`Shared session ${c.session.id.slice(0,8)}`:c.session.title??`Session ${c.session.id.slice(0,8)}`,ne=n("button",{class:"theme",type:"button"});function rt(){try{let e=localStorage.getItem("awf-theme");return e==="light"||e==="dark"?e:"auto"}catch{return"auto"}}function Be(e){e==="auto"?delete document.documentElement.dataset.theme:document.documentElement.dataset.theme=e,ne.textContent=`Theme: ${e[0]?.toUpperCase()}${e.slice(1)}`,ne.setAttribute("aria-label",`Color theme: ${e}. Change theme`)}var R=rt();Be(R);ne.addEventListener("click",()=>{R=R==="auto"?"light":R==="light"?"dark":"auto",Be(R);try{R==="auto"?localStorage.removeItem("awf-theme"):localStorage.setItem("awf-theme",R)}catch{}});var lt={"claude-code":"Claude Code",codex:"Codex CLI",gemini:"Gemini CLI",opencode:"OpenCode"},ct=lt[c.session.agent]??c.session.agent,dt=[xe(c.session.startMs,!0),W<L?`${u(L)} (${[`${u(W)} in turns`,...U>0?[`${u(U)} background work between turns`]:[]].join(", ")})`:u(L),c.session.cwd,`${ct}${c.session.agentVersion?` ${c.session.agentVersion}`:""}`].filter(e=>!!e);G.append(n("header",{class:"top"},n("div",{},n("p",{class:"brand",text:"awf \\xB7 agent waterfall"}),n("h1",{text:V(j(it),220)}),n("p",{class:"meta",text:dt.join(" \\xB7 ")})),ne));var re=c.phases.filter(e=>e.ms>0),B=n("section",{class:"card","aria-label":"Where the time went"});B.append(n("div",{class:"total"},n("span",{class:"value",text:u(L)}),n("span",{class:"sub",text:W>=L?"total":U>0?`total: ${u(W)} in turns, ${u(U)} of background work between turns, ${u(ot)} idle`:`total: ${u(W)} in turns, the rest idle between turns`})));var $e=n("div",{class:"stack",role:"img","aria-label":re.map(e=>`${e.label} ${E(e.share)}`).join(", ")});for(let e of re){let t=n("span",{"data-phase":e.id});t.style.background=_(e.id),t.style.flex=`${e.ms} 1 0`,$e.append(t)}B.append($e);var Fe=n("ul",{class:"legend","aria-label":"Phases. Pick one or more to filter steps"}),qe=new Map;for(let e of re){let t=n("button",{class:"chip",type:"button","aria-pressed":"false",title:e.detail?`${e.label}: ${e.detail}`:e.label},n("span",{class:"sw","aria-hidden":"true"}),n("span",{class:"name",text:e.label}),n("span",{class:"num",text:`${u(e.ms)} \\xB7 ${E(e.share)}`}));t.firstChild.style.background=_(e.id),t.addEventListener("click",()=>{l.phases.has(e.id)?l.phases.delete(e.id):l.phases.add(e.id),ce()}),qe.set(e.id,t),Fe.append(n("li",{},t))}B.append(Fe);var F=c.counts,ut=[[F.modelCalls,"model call"],[F.toolCalls,"tool call"],...F.subagents?[[F.subagents,"subagent"]]:[],[F.failures,"failed check"],[F.reworkLoops,"rework loop"]],we=n("p",{class:"counts"});for(let[e,t]of ut){let[s,...a]=P(e,t).split(" ");we.append(n("span",{},n("b",{text:s??""}),` ${a.join(" ")}`))}if(c.tokens){let e=c.tokens.input+c.tokens.cacheRead+c.tokens.cacheWrite,t=e>0?c.tokens.cacheRead/e:0;we.append(n("span",{},n("b",{text:K(e)}),` tokens in (${E(t)} from cache), `,n("b",{text:K(c.tokens.output)})," out"))}B.append(we);var z=n("ul",{class:"why"}),pt=[...re].sort((e,t)=>t.ms-e.ms),[q,J,Q]=pt;q&&z.append(n("li",{},"Most time went to ",n("b",{text:q.label}),`: ${u(q.ms)} (${E(q.share)})${q.detail?`, ${q.detail}`:""}.`,J?` Then ${J.label} ${u(J.ms)} (${E(J.share)})${Q?` and ${Q.label} ${u(Q.ms)} (${E(Q.share)})`:""}.`:""));if(c.slowest.length){let e=n("li",{},"Slowest steps: ");c.slowest.forEach((t,s)=>{let a=b[t];if(!a)return;let o=a.kind==="model"?b[a.produces?.[0]??-1]:void 0,i=o?D(o):a.kind==="model"?void 0:D(a),r=n("button",{class:"link",type:"button",title:"Show this step"},o?`${a.label} ${u(T(a))}, writing ${o.label}`:a.label,i?n("code",{text:V(j(i),60)}):null,o?"":` ${u(T(a))}`,a.failed?" \\u2715 failed":"");r.addEventListener("click",()=>Xe(t)),e.append(s>0?", ":"",r)}),e.append("."),z.append(e)}if(c.rework.length){let e=c.rework.filter(s=>s.edits>0),t=n("li",{},e.length?"Rework: ":"Rework: none. ");e.slice(0,3).forEach((s,a)=>{t.append(a>0?"; ":"",n("code",{text:s.check}),` failed at ${S(s.failedAt)}`,s.passedAt!==void 0?` and passed at ${S(s.passedAt)} after ${P(s.edits,"edit")}`:` and hadn\'t passed by the end (${P(s.edits,"edit")})`)}),e.length>3&&t.append(`; ${e.length-3} more`),e.length?t.append("."):t.append("checks failed, but no edits followed before they ran again."),z.append(t)}else z.append(n("li",{text:"No rework: no check failed and then got fixed."}));var Z=c.phases.find(e=>e.id==="unclassified");Z&&Z.share>=.05&&c.unclassified.length&&z.append(n("li",{},`Unclassified ${u(Z.ms)} (${E(Z.share)}): `,...c.unclassified.slice(0,3).flatMap((e,t)=>[t>0?", ":"",n("code",{text:e.name}),` ${u(e.ms)}`]),c.unclassifiedModelMs>=1e3?`, and ${u(c.unclassifiedModelMs)} of model time writing those calls`:"",". Rules in ",n("code",{text:".awf/rules.yaml"})," can sort them."));B.append(z);var ye=n("table",{},n("caption",{class:"sr",text:"Time by phase"}));ye.append(n("thead",{},n("tr",{},n("th",{scope:"col",text:"Phase"}),n("th",{scope:"col",class:"n",text:"Time"}),n("th",{scope:"col",class:"n",text:"Share"}),n("th",{scope:"col",text:"Detail"}))));var Me=n("tbody");for(let e of c.phases)Me.append(n("tr",{},n("td",{text:e.label}),n("td",{class:"n",text:u(e.ms)}),n("td",{class:"n",text:E(e.share)}),n("td",{text:e.detail})));Me.append(n("tr",{class:"sum"},n("td",{text:"Total"}),n("td",{class:"n",text:u(L)}),n("td",{class:"n",text:"100%"}),n("td",{})));ye.append(Me);B.append(n("details",{class:"table"},n("summary",{text:"Phase table"}),ye));G.append(B);var se=n("input",{type:"checkbox"}),ae=n("input",{type:"search",placeholder:c.share?"Search tools and phases":"Search commands, files, tools","aria-label":"Search steps"}),oe=n("input",{type:"checkbox"});oe.checked=l.squeeze;var Ne=n("span",{class:"count","aria-live":"polite"}),le=n("button",{class:"link",type:"button",text:"Clear filters"}),We=n("button",{class:"link",type:"button",text:"Expand all"}),De=n("button",{class:"link",type:"button",text:"Collapse all"}),ft=n("div",{class:"filters"},ae,n("label",{},se,"Failed only"),ke.length?n("label",{title:"Squeeze long idle stretches to a sliver"},oe,"Squeeze idle gaps"):null,We,De,le,Ne);G.append(ft);se.addEventListener("change",()=>{l.failedOnly=se.checked,ce()});var Te=0;ae.addEventListener("input",()=>{clearTimeout(Te),Te=window.setTimeout(()=>{l.query=ae.value.trim().toLowerCase(),ce()},120)});oe.addEventListener("change",()=>{l.squeeze=oe.checked,g=Re(l.squeeze),Ve(),C()});le.addEventListener("click",()=>{l.phases.clear(),l.failedOnly=!1,l.query="",se.checked=!1,ae.value="",ce()});We.addEventListener("click",()=>{(v()?l.filterCollapsed:l.collapsed).clear(),C()});De.addEventListener("click",()=>{let e=v()?l.filterCollapsed:l.collapsed;for(let t of k.parents)e.add(t);C()});function ce(){l.filterCollapsed.clear();for(let[e,t]of qe)t.setAttribute("aria-pressed",String(l.phases.has(e))),t.classList.toggle("dim",l.phases.size>0&&!l.phases.has(e));for(let e of $e.children){let t=e.dataset.phase;e.style.opacity=l.phases.size>0&&!l.phases.has(t)?"0.3":""}C()}var Se=n("section",{class:"fall","aria-label":"Waterfall of every step"}),N=n("div",{class:"axis","aria-hidden":"true"}),ee=n("div",{class:"strip",role:"img"}),ze=n("div",{class:"hl"});Se.append(n("div",{class:"head"},ze,N,n("div",{class:"hl sub",text:"Phase at each moment"}),ee));var te=n("div",{class:"lines","aria-hidden":"true"}),A=n("div",{class:"rows",role:"list","aria-label":"Steps"});Se.append(n("div",{class:"body"},te,A));G.append(Se);function Ee(e,t,s){let a=g.x(t);e.style.left=`${a}%`,e.style.width=`${Math.max(0,g.x(s)-a)}%`}var Y=0,Oe=64,he=document.createElement("canvas").getContext("2d"),Le=new Map;function be(e){let t=Le.get(e);return t===void 0&&(he?(he.font=`11.5px ${getComputedStyle(document.body).fontFamily}`,t=he.measureText(e).width):t=e.length*7,Le.set(e,t)),t}function je(){Y=N.clientWidth,Oe=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--pad"))||64;let{ticks:e,unit:t}=st(Y||800);ze.textContent=`Step \\xB7 elapsed ${t}`,N.replaceChildren(),te.replaceChildren();for(let s of e){let a=n("span",{class:`tick${s.x===0?" start":s.x>94?" end":""}`,text:s.text});a.style.left=`${s.x}%`,N.append(a);let o=n("i");o.style.left=`${s.x}%`,te.append(o)}for(let s of g.gaps){let a=n("span",{class:"brk",title:`${u(s.e-s.s)} idle, squeezed`});a.style.left=`${s.x0}%`,a.style.width=`${s.x1-s.x0}%`;let o=n("span",{class:"gapl",text:Pe(s)});o.style.left=`${(s.x0+s.x1)/2}%`,N.append(a,o);let i=n("i",{class:"gap"});i.style.left=`${s.x0}%`,i.style.width=`${s.x1-s.x0}%`,te.append(i)}}function Ve(){je(),ee.replaceChildren(),c.timeline.forEach(([e,t,s],a)=>{if(g.x(t)-g.x(e)<.02)return;let o=n("span",{"data-seg":a});o.style.background=_(s),Ee(o,e,t),ee.append(o)}),ee.setAttribute("aria-label",`Phase over time, from 0 to ${u(L)}. The phase table lists the totals.`)}function Ge(e){let t=[];if(e.kind==="turn")for(let[s,a,o]of c.timeline)a>e.s&&s<e.e&&t.push([Math.max(s,e.s),Math.min(a,e.e),o]);else{let s=a=>{for(let o of ie[a]??[]){let i=b[o];i&&(i.container?s(o):i.phase&&i.e>i.s&&t.push([i.s,i.e,i.phase]))}};s(e.i)}return t}function ht(e){let t=new Map;for(let[s,a,o]of Ge(e))t.set(o,(t.get(o)??0)+a-s);return[...t].sort((s,a)=>a[1]-s[1])}var Ke=(e,t=3)=>ht(e).slice(0,t).map(([s,a])=>`${H(s)} ${u(a)}`).join(" \\xB7 ");function mt(e){let t=n("span",{class:"mix"});Ee(t,e.s,e.e);let s=g.x(e.e)-g.x(e.s);if(s<=0)return t;let a=Ge(e),o=g.x(e.s);for(let[i,r,d]of a){let p=(g.x(i)-o)/s*100,m=(g.x(r)-o)/s*100;if(m-p<.05)continue;let f=n("span");f.style.left=`${p}%`,f.style.width=`${m-p}%`,f.style.background=_(d),t.append(f)}return t}var Ue={approval:"approval",denied:"denied",interrupted:"interrupted",background:"background","api-error":"API error",resent:"request resent",unfinished:"no end seen"};function bt(e){let t=D(e);return[e.label,t?V(j(t),120):"",H(e.phase),u(T(e)),e.failed?"failed":""].filter(Boolean).join(", ")}function gt(e){let t=v(),s=k.parents.has(e.i),a=(t?l.filterCollapsed:l.collapsed).has(e.i),o=n("div",{class:`row${e.container&&!e.phase?" group":""}${e.kind==="idle"?" idle":""}${e.kind==="build-task"?" task":""}${l.open===e.i?" sel":""}`,role:"listitem","data-i":e.i}),i=n("div",{class:"name"});if(i.style.paddingLeft=`calc(6px + ${e.depth} * var(--indent))`,s){let h=ie[e.i]?.length??0;i.append(n("button",{class:"tw",type:"button",tabindex:-1,"aria-expanded":String(!a),"aria-label":`${a?"Show":"Hide"} ${P(h,"step")} inside ${e.label}`,text:a?"\\u25B8":"\\u25BE"}))}else i.append(n("span",{class:"tw","aria-hidden":"true"}));let r=n("button",{class:"pick",type:"button",tabindex:l.focus===e.i?0:-1,"aria-expanded":String(l.open===e.i),"aria-label":bt(e)});if(e.phase&&!e.container){let h=n("span",{class:"dot","aria-hidden":"true"});h.style.background=_(e.phase),r.append(h)}r.append(n("span",{class:"kind",text:e.label}));let d=D(e);d&&r.append(n("span",{class:"text",text:V(j(d),300)})),e.failed&&r.append(n("span",{class:"fail"},"\\u2715",n("span",{class:"w",text:" failed"})));let p=Ze.get(e.i);p!==void 0&&r.append(n("span",{class:"badge",text:p===0?"slowest":`#${p+1} slowest`}));for(let h of e.flags){let I=Ue[h];I&&!(h==="background"&&e.kind==="background")&&r.append(n("span",{class:"badge soft",text:I}))}i.append(r),o.append(i);let m=n("div",{class:"track","aria-hidden":"true"});if(e.container&&a)m.append(mt(e));else{let h=n("span",{class:`bar${e.failed?" failed":""}`});e.failed?h.style.background="var(--critical)":e.phase&&(h.style.background=_(e.phase)),e.started===!1&&h.classList.add("unstarted"),Ee(h,e.s,e.e),m.append(h)}let f=n("span",{class:"dur"},e.failed?n("span",{class:"x",text:"\\u2715 "}):null,u(T(e))),w=g.x(e.s),X=g.x(e.e),x=be(f.textContent??"")+6;return(100-X)/100*Y+Oe>=x+4?f.style.left=`calc(${X}% + 6px)`:w/100*Y>=x+4?f.style.right=`calc(${100-w}% + 6px)`:(f.classList.add("in"),f.style.right=`calc(${100-X}% + 4px)`),m.append(f),o.append(m),l.open===e.i&&o.append(kt(e)),o}function xt(e){let t=e.indexOf(":"),s=t>0?e.slice(0,t):e,a=t>0?e.slice(t+1):"";switch(s){case"script":return`runs the package script "${a}"`;case"make":return`runs the make target "${a}"`;case"task":return`runs the task "${a}"`;case"hook":return`runs the git hook ${a}`;case"file":return`runs the script ${a}`;case"via":return`through ${a}`;case"unmatched":return`no rule for "${a}"`;case"was":return`was ${H(a)||a} before a check failed`}let o={"by-name":"phase guessed from a script or task name",install:"installs dependencies",polling:"waits in a loop",neutral:"only commands that say nothing about the phase","failure-unattributed":"the failure could not be pinned on one check","background-task":"waits on a background task",compaction:"context compaction",subagent:"ran a subagent","no-command":"no command recorded"};return o[e]?o[e]:Ie.has(e)?`also ${H(e)}`:e}function kt(e){let t=n("div",{class:"more",role:"region","aria-label":`Details: ${e.label}`}),s=n("dl"),a=(r,...d)=>s.append(n("dt",{text:r}),n("dd",{},...d));if(e.phase){let r=n("span",{class:"sw","aria-hidden":"true"});r.style.background=_(e.phase),a("Phase",r,H(e.phase),e.reworkFor?` (after ${e.reworkFor} failed)`:"")}if(a("When",`${S(e.s)} \\u2192 ${S(e.e)} \\xB7 ${u(T(e))} \\xB7 ${xe(c.session.startMs+e.s)}`),e.waitMs&&a("Waited for you",u(e.waitMs)),e.runMs!==void 0&&e.waitMs&&a("Ran",u(e.runMs)),e.kind==="tool"||e.kind==="background"){let r=e.failed?n("span",{class:"status-failed",text:"\\u2715 Failed"}):e.ok===!0?"OK":e.ok===!1?"Error":"Unknown";a("Result",r,e.exitCode!==void 0?` \\xB7 exit code ${e.exitCode}`:"")}if(e.tool&&a("Tool",e.tool),e.agentType&&a("Agent type",e.agentType),e.model&&a("Model",e.model),e.tokens){let r=e.tokens,d=T(e)/1e3;a("Tokens",`${K(r.input+r.cacheRead+r.cacheWrite)} in (${K(r.cacheRead)} cached) \\xB7 ${K(r.output)} out`,e.kind==="model"&&d>=1&&r.output>0?` \\xB7 ${Math.round(r.output/d)} tokens/s out`:"")}e.checks.length&&a("Checks",e.checks.map(r=>`${r.key} ${r.failed?"failed":"passed"}`).join(", ")),e.flags.length&&a("Flags",e.flags.map(r=>Ue[r]??r).join(", "));let o=e.tags.map(xt).filter(Boolean);if(o.length&&a("Notes",o.join("; ")),e.kind==="build-task"&&(a("Build tool",e.tool??""),e.started===!1&&a("Start",`not recorded by ${e.tool}: drawn from the build\'s start. Tasks may have run in parallel.`)),e.container){a("Inside",P(ie[e.i]?.length??0,e.kind==="tool"?"build task":"step"));let r=Ke(e,5);r&&a("By phase",r)}e.kind==="tool"&&!c.session.sources.includes("recorder")&&!e.waitMs&&a("Note","May include waiting for your approval: only the recorder (the plugin) sees approvals."),t.append(s);let i=(r,d)=>t.append(n("h3",{text:r}),n("pre",{text:d}));if(e.kind==="model"&&e.produces?.length){t.append(n("h3",{text:"Wrote these calls"}));let r=n("ul",{class:"made"});for(let d of e.produces){let p=b[d];if(!p)continue;let m=D(p),f=n("button",{class:"link",type:"button"},p.label,m?n("code",{text:V(j(m),100)}):null,` ${u(T(p))}`);f.addEventListener("click",w=>{w.stopPropagation(),Xe(d)}),r.append(n("li",{},f))}t.append(r)}else e.text&&e.tool==="Bash"&&i("Command",e.text);return e.files?.length&&i(e.files.length===1?"File":"Files",e.files.join(`\n`)),e.description&&e.description!==e.text&&i("Description",e.description),e.output&&i(`Output (secrets masked${e.output.length>=4e3?", first 4,000 characters":""})`,e.output),c.share&&t.append(n("p",{class:"note",text:"Shared report: commands, files and output are left out."})),t}function C(){let e=A.contains(document.activeElement);k=He(),k.rows.some(a=>a.i===l.focus)||(l.focus=k.rows[0]?.i??-1);let t=document.createDocumentFragment();for(let a of k.rows)t.append(gt(a));k.rows.length||t.append(n("p",{class:"empty",text:b.length?"No steps match these filters.":"This session has no steps."})),A.replaceChildren(t);let s=k.rows.filter(a=>!a.container).length;Ne.textContent=v()?`${P(s,"step")} match, of ${me.toLocaleString("en-US")}`:P(me,"step"),le.hidden=!v(),e&&O(l.focus)}function O(e){l.focus=e;for(let s of A.querySelectorAll(".pick"))s.tabIndex=-1;let t=A.querySelector(`.row[data-i="${e}"] .pick`);t&&(t.tabIndex=0,t.focus({preventScroll:!1}))}function ge(e){let t=v()?l.filterCollapsed:l.collapsed;t.has(e)?t.delete(e):t.add(e),l.focus=e,C(),O(e)}function Ye(e){l.open=l.open===e?-1:e,l.focus=e,C(),O(e)}function Xe(e){let t=b[e];if(t){v()&&!_e(t)&&le.click();for(let s=t.p;s>=0;s=b[s]?.p??-1)l.collapsed.delete(s),l.filterCollapsed.delete(s);l.open=e,l.focus=e,C(),O(e),A.querySelector(`.row[data-i="${e}"]`)?.scrollIntoView({block:"center"})}}A.addEventListener("click",e=>{let t=e.target;if(t.closest(".more"))return;let s=t.closest(".row");if(!s)return;let a=Number(s.getAttribute("data-i"));t.closest(".tw")?ge(a):Ye(a)});A.addEventListener("keydown",e=>{let t=e.target.closest(".row");if(!t||!e.target.closest(".pick"))return;let s=Number(t.getAttribute("data-i")),a=k.rows.findIndex(d=>d.i===s),o=b[s];if(!o)return;let i=(v()?l.filterCollapsed:l.collapsed).has(s),r=d=>{let p=k.rows[Math.max(0,Math.min(k.rows.length-1,d))];p&&O(p.i)};switch(e.key){case"ArrowDown":r(a+1);break;case"ArrowUp":r(a-1);break;case"Home":r(0);break;case"End":r(k.rows.length-1);break;case"ArrowRight":k.parents.has(s)&&i?ge(s):k.parents.has(s)&&r(a+1);break;case"ArrowLeft":k.parents.has(s)&&!i?ge(s):o.p>=0&&O(o.p);break;case"Escape":l.open>=0&&Ye(l.open);break;default:return}e.preventDefault()});var y=n("div",{class:"tip",role:"tooltip",hidden:!0});document.body.append(y);var $t=window.matchMedia("(hover: hover)").matches;function wt(e){let t=e.closest("[data-phase]");if(t){let i=c.phases.find(r=>r.id===t.dataset.phase);if(i)return[n("b",{text:i.label}),n("span",{text:`${u(i.ms)} \\xB7 ${E(i.share)}${i.detail?` \\xB7 ${i.detail}`:""}`})]}let s=e.closest("[data-seg]");if(s){let i=c.timeline[Number(s.dataset.seg)];if(i)return[n("b",{text:H(i[2])}),n("span",{text:`${S(i[0])} \\u2192 ${S(i[1])} \\xB7 ${u(i[1]-i[0])}`})]}let o=e.closest(".track")?.closest(".row");if(o){let i=b[Number(o.getAttribute("data-i"))];if(!i)return;let r=D(i);return[n("b",{text:i.label}),r?n("code",{text:V(j(r),160)}):null,n("span",{text:[H(i.phase),u(T(i)),`${S(i.s)} \\u2192 ${S(i.e)}`,i.failed?"\\u2715 failed":""].filter(Boolean).join(" \\xB7 ")}),i.container?n("span",{text:Ke(i)}):null]}}$t&&(document.addEventListener("mousemove",e=>{let t=e.target instanceof Element?wt(e.target):void 0;if(!t){y.hidden=!0;return}y.replaceChildren(...t.filter(r=>!!r)),y.hidden=!1;let s=y.offsetWidth,a=y.offsetHeight,o=Math.min(e.clientX+14,window.innerWidth-s-8),i=e.clientY+18+a>window.innerHeight?e.clientY-a-12:e.clientY+18;y.style.left=`${Math.max(8,o)}px`,y.style.top=`${Math.max(8,i)}px`}),document.addEventListener("mouseleave",()=>y.hidden=!0));G.append(n("footer",{class:"foot"},`Made by awf ${Ce} on ${xe(c.generatedAt,!0)}. `,c.share?"Shared report: phases, durations and tool names only.":"This file holds commands, file paths and tool output from the session, with secrets masked. Make a version without them with --share."));Ve();C();var Ae=0;window.addEventListener("resize",()=>{cancelAnimationFrame(Ae),Ae=requestAnimationFrame(()=>{N.clientWidth!==Y&&(je(),C())})});document.body.dataset.ready="1";document.body.dataset.renderMs=String(Math.round(performance.now()-Qe));})();';
var CLIENT_CSS = ':root{color-scheme:light;--page: #f9f9f7;--surface: #fcfcfb;--raised: #ffffff;--ink: #0b0b0b;--ink-2: #52514e;--muted: #6f6d68;--grid: #e8e7e1;--axis: #c3c2b7;--ring: rgba(11, 11, 11, .12);--hover: rgba(11, 11, 11, .04);--selected: rgba(42, 120, 214, .08);--focus: #2a78d6;--link: #1f63b5;--critical: #d03b3b;--critical-ink: #b42323;--container: #a3a29b;--c-writing-code: #2a78d6;--c-writing-tests: #eb6834;--c-lint: #1baf7a;--c-tests: #eda100;--c-build: #e87ba4;--c-rework: #6250d6;--c-exploring: #008300;--c-running: #0b5f73;--c-planning: #7b8494;--c-waiting: repeating-linear-gradient(135deg, #a9a8a0 0 2px, #e2e1da 2px 5px);--c-unclassified: #a5a49d;--mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;--sans: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;--label: 34%;--pad: 64px;--indent: 14px;--row: 28px}@media(prefers-color-scheme:dark){:root:not([data-theme=light]){color-scheme:dark;--page: #0d0d0d;--surface: #1a1a19;--raised: #222220;--ink: #f0efec;--ink-2: #c3c2b7;--muted: #9c9a92;--grid: #2a2a28;--axis: #383835;--ring: rgba(255, 255, 255, .12);--hover: rgba(255, 255, 255, .05);--selected: rgba(57, 135, 229, .14);--focus: #3987e5;--link: #7fb1ef;--critical: #e05252;--critical-ink: #f08080;--container: #6e6d68;--c-writing-code: #3987e5;--c-writing-tests: #d95926;--c-lint: #199e70;--c-tests: #c98500;--c-build: #d55181;--c-rework: #9085e9;--c-exploring: #008300;--c-running: #86cfe0;--c-planning: #8a93a3;--c-waiting: repeating-linear-gradient(135deg, #7a7973 0 2px, #33332f 2px 5px);--c-unclassified: #6e6d68}}:root[data-theme=dark]{color-scheme:dark;--page: #0d0d0d;--surface: #1a1a19;--raised: #222220;--ink: #f0efec;--ink-2: #c3c2b7;--muted: #9c9a92;--grid: #2a2a28;--axis: #383835;--ring: rgba(255, 255, 255, .12);--hover: rgba(255, 255, 255, .05);--selected: rgba(57, 135, 229, .14);--focus: #3987e5;--link: #7fb1ef;--critical: #e05252;--critical-ink: #f08080;--container: #6e6d68;--c-writing-code: #3987e5;--c-writing-tests: #d95926;--c-lint: #199e70;--c-tests: #c98500;--c-build: #d55181;--c-rework: #9085e9;--c-exploring: #008300;--c-running: #86cfe0;--c-planning: #8a93a3;--c-waiting: repeating-linear-gradient(135deg, #7a7973 0 2px, #33332f 2px 5px);--c-unclassified: #6e6d68}*{box-sizing:border-box}html,body{margin:0;background:var(--page);color:var(--ink);font:14px/1.45 var(--sans);-webkit-text-size-adjust:100%}button,input{font:inherit;color:inherit}:focus-visible{outline:2px solid var(--focus);outline-offset:2px}[hidden]{display:none!important}.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}.wrap{max-width:1440px;margin:0 auto;padding:20px 24px 48px}code{font-family:var(--mono);font-size:12.5px;background:var(--hover);border-radius:4px;padding:1px 4px;overflow-wrap:anywhere}.top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.brand{font-size:12px;color:var(--muted);letter-spacing:.02em;margin:0 0 6px}h1{font-size:20px;line-height:1.3;font-weight:600;margin:0 0 6px;overflow-wrap:anywhere}.meta{color:var(--ink-2);margin:0;overflow-wrap:anywhere}.theme{flex:none;border:1px solid var(--ring);background:var(--surface);border-radius:8px;padding:6px 10px;cursor:pointer;color:var(--ink-2)}.theme:hover{background:var(--hover)}.card{background:var(--surface);border:1px solid var(--ring);border-radius:12px;padding:16px;margin-top:16px}.total{display:flex;align-items:baseline;flex-wrap:wrap;gap:4px 12px;margin-bottom:12px}.total .value{font-size:28px;font-weight:600;font-variant-numeric:tabular-nums}.total .sub{color:var(--ink-2)}.stack{display:flex;gap:2px;height:18px;width:100%}.stack span{height:100%;min-width:2px}.stack span:first-child{border-radius:4px 0 0 4px}.stack span:last-child{border-radius:0 4px 4px 0}.stack span:only-child{border-radius:4px}.legend{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0;padding:0;list-style:none}.chip{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--ring);background:var(--raised);border-radius:999px;padding:4px 10px 4px 8px;cursor:pointer;min-height:30px;text-align:left}.chip:hover{background:var(--hover)}.chip[aria-pressed=true]{border-color:var(--ink-2);box-shadow:inset 0 0 0 1px var(--ink-2)}.chip.dim{opacity:.5}.sw{display:inline-block;width:10px;height:10px;border-radius:3px;flex:none}.chip .num{color:var(--ink-2);font-variant-numeric:tabular-nums}.counts{display:flex;flex-wrap:wrap;gap:4px 18px;margin:14px 0 0;color:var(--ink-2)}.counts b{color:var(--ink);font-weight:600;font-variant-numeric:tabular-nums}.why{margin:12px 0 0;padding:0 0 0 18px}.why li{margin:5px 0}.why b{font-weight:600}.link{border:0;background:none;color:var(--link);cursor:pointer;padding:2px 0;text-align:left}.link:hover{text-decoration:underline}.link code{margin:0 3px;color:var(--ink)}details.table{margin-top:12px}details.table summary{cursor:pointer;color:var(--ink-2)}details.table table{border-collapse:collapse;margin-top:8px;width:100%;max-width:680px}details.table th,details.table td{text-align:left;padding:4px 8px;border-bottom:1px solid var(--grid);font-variant-numeric:tabular-nums}details.table th{color:var(--muted);font-weight:500}details.table .n{text-align:right}details.table .sum td{font-weight:600;border-bottom:0}.filters{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;margin:20px 0 10px}.filters label{display:inline-flex;align-items:center;gap:6px;cursor:pointer;min-height:32px}.filters input[type=search]{border:1px solid var(--ring);background:var(--surface);border-radius:8px;padding:6px 10px;flex:1 1 240px;max-width:360px;min-height:34px}.filters .count{color:var(--muted);margin-left:auto;font-variant-numeric:tabular-nums}.fall{background:var(--surface);border:1px solid var(--ring);border-radius:12px;overflow:clip}.head{position:sticky;top:0;z-index:3;display:grid;grid-template-columns:var(--label) 1fr;background:var(--surface);border-bottom:1px solid var(--grid)}.hl{padding:6px 12px 0;color:var(--muted);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.hl.sub{padding:2px 12px 8px}.axis{position:relative;height:26px;margin-right:var(--pad)}.tick{position:absolute;top:6px;transform:translate(-50%);font-size:11.5px;color:var(--muted);font-variant-numeric:tabular-nums;white-space:nowrap}.tick.start{transform:none}.tick.end{transform:translate(-100%)}.brk{position:absolute;top:4px;bottom:2px;background:repeating-linear-gradient(135deg,transparent 0 3px,var(--axis) 3px 4px);border-radius:2px}.strip{position:relative;height:10px;margin:4px var(--pad) 10px 0;border-radius:3px;overflow:hidden;background:var(--grid)}.strip span{position:absolute;top:0;bottom:0}.body{position:relative}.lines{position:absolute;top:0;bottom:0;left:var(--label);right:var(--pad);pointer-events:none}.lines i{position:absolute;top:0;bottom:0;width:1px;background:var(--grid)}.lines i.gap{background:repeating-linear-gradient(135deg,transparent 0 5px,var(--grid) 5px 6px)}.rows{position:relative}.row{display:grid;grid-template-columns:var(--label) 1fr;align-items:center;cursor:pointer}.row:hover{background:var(--hover)}.row.sel{background:var(--selected)}.name{display:flex;align-items:center;gap:4px;min-width:0;min-height:var(--row);padding-right:8px}.tw{width:18px;height:22px;flex:none;color:var(--muted);text-align:center;font-size:11px;border:0;background:none;padding:0;border-radius:4px;cursor:pointer}button.tw:hover{background:var(--hover);color:var(--ink)}.pick{display:flex;align-items:center;gap:6px;min-width:0;flex:1 1 auto;border:0;background:none;padding:2px 0;text-align:left;cursor:pointer;white-space:nowrap;border-radius:4px}.dot{width:8px;height:8px;border-radius:2px;flex:none}.kind{flex:0 0 auto;max-width:60%;overflow:hidden;text-overflow:ellipsis}.text{flex:0 1 auto;min-width:0;color:var(--ink-2);font-family:var(--mono);font-size:12px;overflow:hidden;text-overflow:ellipsis}.row.group .kind{font-weight:600}.row.idle .kind{color:var(--muted)}.fail{flex:none;color:var(--critical-ink);font-weight:600;font-size:12.5px}.badge{flex:none;border:1px solid var(--ring);background:var(--raised);color:var(--ink);border-radius:999px;font-size:10.5px;padding:0 6px;line-height:16px}.badge.soft{color:var(--ink-2);background:none}.track{position:relative;height:var(--row);margin-right:var(--pad)}.bar,.mix{position:absolute;top:calc(50% - 6px);height:12px;min-width:2px;border-radius:3px}.row.group .bar{top:calc(50% - 2px);height:4px;background:var(--container);border-radius:2px}.mix{top:calc(50% - 4px);height:8px;overflow:hidden;background:var(--grid);border-radius:2px}.mix span{position:absolute;top:0;bottom:0}.row.task .bar{top:calc(50% - 4px);height:8px;opacity:.85}.row.task .bar.unstarted{background-image:repeating-linear-gradient(90deg,transparent 0 6px,var(--surface) 6px 7px)!important}.row.task .kind{font-family:var(--mono);font-size:12px;color:var(--ink-2)}.gapl{position:absolute;top:5px;transform:translate(-50%);font-size:11px;color:var(--ink-2);background:var(--surface);border:1px solid var(--grid);border-radius:4px;padding:0 4px;white-space:nowrap}.made{margin:6px 0 0;padding-left:18px}.dur{position:absolute;top:calc(50% - 9px);font-size:11.5px;line-height:18px;color:var(--ink-2);white-space:nowrap;font-variant-numeric:tabular-nums;pointer-events:none}.dur .x{color:var(--critical-ink);font-weight:600}.dur.in{background:var(--surface);border-radius:4px;padding:0 4px}.empty{padding:24px 16px;margin:0;color:var(--muted)}.more{grid-column:1 / -1;position:relative;z-index:1;margin:2px 12px 10px;background:var(--raised);border:1px solid var(--ring);border-radius:10px;padding:12px 14px;cursor:auto}.more dl{display:grid;grid-template-columns:max-content 1fr;gap:4px 14px;margin:0}.more dt{color:var(--muted)}.more dd{margin:0;overflow-wrap:anywhere}.more dd .sw{margin-right:6px;vertical-align:-1px}.more h3{font-size:12.5px;font-weight:600;margin:14px 0 0;color:var(--ink-2)}.more pre{font-family:var(--mono);font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere;background:var(--surface);border:1px solid var(--ring);border-radius:8px;padding:8px 10px;margin:6px 0 0;max-height:360px;overflow:auto}.status-failed{color:var(--critical-ink);font-weight:600}.note,.foot{color:var(--muted);font-size:12.5px;margin:10px 0 0}.foot{margin-top:20px}.tip{position:fixed;z-index:20;pointer-events:none;display:flex;flex-direction:column;gap:2px;background:var(--raised);border:1px solid var(--ring);border-radius:8px;padding:6px 9px;box-shadow:0 6px 20px #00000024;font-size:12.5px;max-width:360px}.tip span{color:var(--ink-2)}.tip code{align-self:flex-start}@media(max-width:760px){:root{--label: 44%;--pad: 52px;--indent: 8px;--row: 36px}.wrap{padding:14px 16px 40px}h1{font-size:17px}.top{flex-direction:column-reverse;gap:10px}.theme{align-self:flex-end}.pick{flex-wrap:wrap;row-gap:0;padding:4px 0}.text{flex:1 0 100%;order:10;padding-left:14px;font-size:11.5px}.badge.soft,.fail .w{display:none}.filters input[type=search]{max-width:none;flex-basis:100%}.filters .count{margin-left:0}.more{margin:2px 6px 10px}.legend{display:grid;grid-template-columns:1fr 1fr}.chip{display:grid;grid-template-columns:auto 1fr;column-gap:6px;align-items:center;width:100%;height:100%;border-radius:10px;padding:5px 8px;font-size:13px}.chip .num{grid-column:2;font-size:12px}.more dl{grid-template-columns:1fr;gap:0}.more dd{margin-bottom:6px}}@media print{.filters,.theme{display:none}.row{break-inside:avoid}}';

// src/report/html.ts
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
function scriptJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
function renderReportHtml(data) {
  const title = data.share ? `awf \xB7 session ${data.session.id}` : `awf \xB7 ${data.session.title ?? `session ${data.session.id.slice(0, 8)}`}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'">
<meta name="referrer" content="no-referrer">
<meta name="generator" content="awf">
<title>${escapeHtml(title.length > 90 ? title.slice(0, 89) + "\u2026" : title)}</title>
<style>${CLIENT_CSS}</style>
</head>
<body>
<noscript>This report draws itself with JavaScript; turn it on to see the waterfall.</noscript>
<div id="app"></div>
<script type="application/json" id="awf-data">${scriptJson(data)}</script>
<script>${CLIENT_JS}</script>
</body>
</html>
`;
}

// src/cli/commands/report.ts
var reportCommand = {
  summary: "Write a session as one self-contained HTML waterfall",
  usage: `Usage: awf report <session> [--out <file.html>] [--share] [--open] [--json]

Writes one HTML file that draws the session: time by phase, the phase at each moment, and every
step on a waterfall, with failures, rework and the slowest steps marked. Styles and script are
inside the file, and it makes no network requests. <session> is an ID or its first characters,
"last", or a transcript or events file.
  --out <file>  where to write it (default: ~/.awf/reports/<session>.html)
  --share       phases, durations and tool names only: no task, folder, commands, files or output
  --open        open it in your browser
  --json        print the report's data as JSON instead`,
  options: {
    out: { type: "string", short: "o" },
    share: { type: "boolean" },
    open: { type: "boolean" },
    json: { type: "boolean" },
    project: { type: "string" }
  },
  run(ctx, args, options) {
    const share = options.share === true;
    const session = loadOne(ctx, args[0], options, !share);
    if (!share) attachBuildTimings(session);
    const home = ctx.env.HOME ?? os9.homedir();
    const data = buildReportData(summarize(classifier()(session)), { share, home, now: ctx.now });
    if (options.json) {
      ctx.io.out(JSON.stringify(data, null, 2));
      return 0;
    }
    const out = typeof options.out === "string" ? path21.resolve(ctx.cwd, options.out) : path21.join(
      awfHome(ctx.env),
      "reports",
      `${safeId(session.id)}${share ? "-share" : ""}.html`
    );
    mkdirSync3(path21.dirname(out), { recursive: true });
    writeFileSync3(out, renderReportHtml(data));
    ctx.io.out(
      `Wrote ${homeRelative(out, home)}${share ? " (shareable: no commands, files or output)" : ""}`
    );
    ctx.io.out(pathToFileURL(out).href);
    if (options.open) openInBrowser(out, ctx);
    return 0;
  }
};
function openInBrowser(file, ctx) {
  const [command, args] = process.platform === "darwin" ? ["open", [file]] : process.platform === "win32" ? ["explorer", [file]] : ["xdg-open", [file]];
  try {
    const child = spawn(command, args, { stdio: "ignore", detached: true });
    child.on(
      "error",
      () => ctx.io.err(`awf report: couldn't open a browser; open the file above.`)
    );
    child.unref();
  } catch {
    ctx.io.err(`awf report: couldn't open a browser; open the file above.`);
  }
}

// src/cli/commands/sample.ts
import { readFileSync as readFileSync12 } from "node:fs";
import path22 from "node:path";
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
  usage: `Usage: awf sample [--n 50] [--seed 1] [--since 30d] [--project <dir>] [--csv] [--json]

Prints random Bash calls from your sessions with the phase awf gave each, for a hand check.
With --csv it writes "command,cwd,awf_phase,your_phase": fill in your_phase with a phase id
(${PHASES.map((p) => p.id).join(", ")}) and run "awf accuracy <file>".
  --json   print the sample as a JSON array of { command, cwd, phase }`,
  options: {
    n: { type: "string" },
    seed: { type: "string" },
    since: { type: "string" },
    project: { type: "string" },
    csv: { type: "boolean" },
    json: { type: "boolean" }
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
    if (options.json) {
      ctx.io.out(JSON.stringify(picked, null, 2));
      return 0;
    }
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
    const rows = parseCsv(readFileSync12(path22.resolve(ctx.cwd, file), "utf8"));
    const header2 = rows.shift() ?? [];
    const col = (name) => header2.indexOf(name);
    const [ci, wi, yi] = [col("command"), col("cwd"), col("your_phase")];
    if (ci < 0 || yi < 0) throw new Error('the CSV needs "command" and "your_phase" columns');
    const files2 = diskFiles();
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
      const awf = new Classifier(loadRules(cwd, files2), files2).command(row[ci] ?? "", cwd).phase;
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
import os10 from "node:os";
import path23 from "node:path";
function sessionRow(session) {
  const idleMs = session.steps.filter((s) => s.kind === "idle").reduce((sum, s) => sum + (s.endMs - s.startMs), 0);
  const durationMs = Math.max(0, session.endMs - session.startMs);
  const row = {
    id: session.id,
    startMs: session.startMs,
    endMs: session.endMs,
    durationMs,
    turnsMs: Math.max(0, durationMs - idleMs),
    turns: session.steps.filter((s) => s.kind === "turn").length,
    toolCalls: session.steps.filter((s) => s.kind === "tool").length,
    sources: session.sources
  };
  if (session.cwd) row.cwd = session.cwd;
  return row;
}
function inFolder(cwd, dir) {
  if (!dir) return true;
  return !!cwd && (cwd === dir || cwd.startsWith(dir + path23.sep));
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
IN TURNS is the time from each prompt (or notice) to the end of the agent's answer, without the
gaps between turns. Background work in those gaps (subagents, builds left running) isn't in it:
"awf summary <session>" shows it.
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
    const project = typeof options.project === "string" ? path23.resolve(ctx.cwd, options.project) : void 0;
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
    const home = ctx.env.HOME ?? os10.homedir();
    ctx.io.out(
      table(
        ["SESSION", "STARTED", "DURATION", "IN TURNS", "TURNS", "TOOLS", "SOURCE", "PROJECT"],
        rows.map((r) => [
          r.id.slice(0, 8),
          formatClock(r.startMs),
          formatDuration(r.durationMs),
          formatDuration(r.turnsMs),
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
var POLLING = "(polling: sleep in a loop, or a long sleep)";
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
        const polling = step.decidedBy === "polling" || focus === "unclassified" && step.tags.includes("polling");
        const head2 = polling ? POLLING : focus === "unclassified" ? unmatched ?? (step.command ? commandHead(step.command) : "(no command)") : step.decidedBy ?? (step.command ? commandHead(step.command) : "(no command)");
        const h = heads.get(head2) ?? { ms: 0, calls: 0 };
        h.ms += ms;
        h.calls++;
        heads.set(head2, h);
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
  --phase <id>   break this phase down instead of unclassified (tests, build, exploring, ...), by
                 the part of each command that decided its phase: xcodebuild test, cargo test`,
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

// src/cli/commands/summary.ts
import os11 from "node:os";
var summaryCommand = {
  summary: "One line per phase: time, share, runs and failures",
  usage: `Usage: awf summary <session> [--json] [--share]

Shows where a session's time went, one line per phase, with check runs, failures and rework.
Phase times add up to the session's total. <session> is an ID or its first characters, "last",
or a transcript or events file.
  --json    print JSON
  --share   phases, durations and tool names only: no task, folder, commands or files`,
  options: {
    json: { type: "boolean" },
    share: { type: "boolean" },
    project: { type: "string" }
  },
  run(ctx, args, options) {
    const classified = classifier()(loadOne(ctx, args[0], options, true));
    const { summary } = summarize(options.share ? shareSession(classified) : classified);
    if (options.share) {
      delete summary.title;
      delete summary.cwd;
      for (const window of summary.rework)
        window.check = window.check.replace(/^(\w+):(npm|pnpm|yarn|bun|deno|make) .*/, "$1:$2");
    }
    if (options.json) {
      ctx.io.out(JSON.stringify(summary, null, 2));
      return 0;
    }
    const home = ctx.env.HOME ?? os11.homedir();
    const header2 = [
      `Session ${summary.id.slice(0, 8)}`,
      formatClock(summary.startMs),
      formatDurationLine(summary),
      ...summary.cwd ? [homeRelative(summary.cwd, home)] : []
    ].join(" \xB7 ");
    ctx.io.out(header2);
    if (summary.title) ctx.io.out(`Task: ${summary.title}`);
    ctx.io.out("");
    for (const line of formatSummaryLines(summary)) ctx.io.out(line);
    return 0;
  }
};

// src/cli/main.ts
var defaultIo = {
  out: (text) => process.stdout.write(text + "\n"),
  err: (text) => process.stderr.write(text + "\n"),
  input: () => process.stdin.isTTY ? void 0 : readFileSync13(0, "utf8")
};
var COMMANDS = {
  sessions: sessionsCommand,
  import: importCommand,
  classify: classifyCommand,
  summary: summaryCommand,
  report: reportCommand,
  compare: compareCommand,
  stats: statsCommand,
  statusline: statuslineCommand,
  live: liveCommand,
  sample: sampleCommand,
  accuracy: accuracyCommand,
  doctor: doctorCommand,
  purge: purgeCommand
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
    parsed = parseArgs2({
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
