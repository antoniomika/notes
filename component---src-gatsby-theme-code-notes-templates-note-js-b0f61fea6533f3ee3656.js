(window.webpackJsonp=window.webpackJsonp||[]).push([[5],{"5Q0V":function(e,t,r){var n=r("cDf5").default;e.exports=function(e,t){if("object"!=n(e)||!e)return e;var r=e[Symbol.toPrimitive];if(void 0!==r){var o=r.call(e,t||"default");if("object"!=n(o))return o;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===t?String:Number)(e)},e.exports.__esModule=!0,e.exports.default=e.exports},"7nAh":function(e,t,r){"use strict";r.r(t);var n=r("q1tI"),o=r.n(n),a=r("izhR"),l=r("A2+M"),s=r("46ic"),i=r("Gr+A"),u=r("lazi"),c=r("voR5");const p=e=>{let{items:t}=e;return o.a.createElement("ul",null,t.map(e=>o.a.createElement(f,{key:e.url+"-item",item:e})))},f=e=>{let{item:t}=e;return o.a.createElement("li",null,o.a.createElement(a.j,{href:t.url},t.title),t.items&&t.items.length&&o.a.createElement(p,{key:t.url+"-list",items:t.items}))},m=e=>{let{toc:t}=e;return t.items?o.a.createElement(a.b,{as:"details",sx:{my:4}},o.a.createElement("summary",null,"Table of contents"),o.a.createElement(p,{items:t.items,key:"toc-list"})):null};t.default=e=>{let{data:t,pageContext:r,location:n}=e;if(!t)return null;const{frontmatter:{title:p,tags:f,emoji:d,link:x,date:b},fields:{dateModified:y},body:v,parent:{fileName:h},tableOfContents:g}=t.mdx,{gitRepoContentPath:E}=Object(c.a)(),O=!!(x||y||b);return o.a.createElement(i.a,{hasUntagged:r.hasUntagged,basePath:r.basePath,path:n.pathname,title:p},o.a.createElement("article",null,o.a.createElement(a.b,{as:"header",mb:4},d&&o.a.createElement(a.b,{sx:{fontSize:7,lineHeight:1,mb:3}},o.a.createElement("span",{role:"img"},d)),o.a.createElement(a.f,{as:"h1",variant:"noteTitle"},p),O&&o.a.createElement(a.e,{sx:{mb:3}},x&&o.a.createElement(a.j,{href:x,sx:{mr:3,fontFamily:"monospace",fontSize:0}},x),!1),f&&o.a.createElement(a.e,null,o.a.createElement(s.a,{tags:f}))),o.a.createElement(m,{toc:g}),o.a.createElement(l.MDXRenderer,null,v),o.a.createElement(a.b,{sx:{mt:6,pt:4,borderTop:"2px solid",borderTopColor:"background"}},o.a.createElement(a.e,null,E&&o.a.createElement(a.j,{href:""+E+h},"Edit this page")),o.a.createElement("p",null,o.a.createElement(u.a,null,"Date: ",b)))))}},"A2+M":function(e,t,r){const n=r("X8hv");e.exports={MDXRenderer:n}},Bnag:function(e,t){e.exports=function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")},e.exports.__esModule=!0,e.exports.default=e.exports},EbDI:function(e,t){e.exports=function(e){if("undefined"!=typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)},e.exports.__esModule=!0,e.exports.default=e.exports},Ijbi:function(e,t,r){var n=r("WkPL");e.exports=function(e){if(Array.isArray(e))return n(e)},e.exports.__esModule=!0,e.exports.default=e.exports},QILm:function(e,t,r){var n=r("8OQS");e.exports=function(e,t){if(null==e)return{};var r,o,a=n(e,t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(o=0;o<l.length;o++)r=l[o],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a},e.exports.__esModule=!0,e.exports.default=e.exports},RIqP:function(e,t,r){var n=r("Ijbi"),o=r("EbDI"),a=r("ZhPi"),l=r("Bnag");e.exports=function(e){return n(e)||o(e)||a(e)||l()},e.exports.__esModule=!0,e.exports.default=e.exports},WkPL:function(e,t){e.exports=function(e,t){(null==t||t>e.length)&&(t=e.length);for(var r=0,n=new Array(t);r<t;r++)n[r]=e[r];return n},e.exports.__esModule=!0,e.exports.default=e.exports},X8hv:function(e,t,r){var n=r("RIqP"),o=r("sXyB"),a=r("lSNA"),l=r("QILm");const s=["scope","children"];function i(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function u(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?i(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}const c=r("q1tI"),{mdx:p}=r("7ljp"),{useMDXScope:f}=r("BfwJ");e.exports=function(e){let{scope:t,children:r}=e,a=l(e,s);const i=f(t),m=c.useMemo(()=>{if(!r)return null;const e=u({React:c,mdx:p},i),t=Object.keys(e),a=t.map(t=>e[t]);return o(Function,["_fn"].concat(t,[""+r])).apply(void 0,[{}].concat(n(a)))},[r,t]);return c.createElement(m,u({},a))}},ZhPi:function(e,t,r){var n=r("WkPL");e.exports=function(e,t){if(e){if("string"==typeof e)return n(e,t);var r=Object.prototype.toString.call(e).slice(8,-1);return"Object"===r&&e.constructor&&(r=e.constructor.name),"Map"===r||"Set"===r?Array.from(e):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?n(e,t):void 0}},e.exports.__esModule=!0,e.exports.default=e.exports},b48C:function(e,t){function r(){try{var t=!Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){})))}catch(t){}return(e.exports=r=function(){return!!t},e.exports.__esModule=!0,e.exports.default=e.exports)()}e.exports=r,e.exports.__esModule=!0,e.exports.default=e.exports},lSNA:function(e,t,r){var n=r("o5UB");e.exports=function(e,t,r){return(t=n(t))in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e},e.exports.__esModule=!0,e.exports.default=e.exports},o5UB:function(e,t,r){var n=r("cDf5").default,o=r("5Q0V");e.exports=function(e){var t=o(e,"string");return"symbol"==n(t)?t:String(t)},e.exports.__esModule=!0,e.exports.default=e.exports},sXyB:function(e,t,r){var n=r("SksO"),o=r("b48C");e.exports=function(e,t,r){if(o())return Reflect.construct.apply(null,arguments);var a=[null];a.push.apply(a,t);var l=new(e.bind.apply(e,a));return r&&n(l,r.prototype),l},e.exports.__esModule=!0,e.exports.default=e.exports}}]);
//# sourceMappingURL=component---src-gatsby-theme-code-notes-templates-note-js-b0f61fea6533f3ee3656.js.map