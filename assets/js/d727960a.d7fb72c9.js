"use strict";(self.webpackChunkcoinstac_docs=self.webpackChunkcoinstac_docs||[]).push([[809],{3905:(e,t,r)=>{r.d(t,{Zo:()=>p,kt:()=>m});var n=r(7294);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function i(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function o(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?i(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function c(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},i=Object.keys(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var s=n.createContext({}),l=function(e){var t=n.useContext(s),r=t;return e&&(r="function"==typeof e?e(t):o(o({},t),e)),r},p=function(e){var t=l(e.components);return n.createElement(s.Provider,{value:t},e.children)},u="mdxType",v={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},d=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,i=e.originalType,s=e.parentName,p=c(e,["components","mdxType","originalType","parentName"]),u=l(r),d=a,m=u["".concat(s,".").concat(d)]||u[d]||v[d]||i;return r?n.createElement(m,o(o({ref:t},p),{},{components:r})):n.createElement(m,o({ref:t},p))}));function m(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var i=r.length,o=new Array(i);o[0]=d;var c={};for(var s in t)hasOwnProperty.call(t,s)&&(c[s]=t[s]);c.originalType=e,c[u]="string"==typeof e?e:a,o[1]=c;for(var l=2;l<i;l++)o[l]=r[l];return n.createElement.apply(null,o)}return n.createElement.apply(null,r)}d.displayName="MDXCreateElement"},6443:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>s,contentTitle:()=>o,default:()=>v,frontMatter:()=>i,metadata:()=>c,toc:()=>l});var n=r(7462),a=(r(7294),r(3905));const i={sidebar_position:2},o="Application overview",c={unversionedId:"developer/application-overview",id:"developer/application-overview",title:"Application overview",description:"GUI",source:"@site/docs/developer/application-overview.md",sourceDirName:"developer",slug:"/developer/application-overview",permalink:"/coinstac/developer/application-overview",draft:!1,editUrl:"https://github.com/trendscenter/coinstac/tree/master/coinstac-docs/docs/developer/application-overview.md",tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_position:2},sidebar:"tutorialSidebar",previous:{title:"Setting up a Coinstac Development Environment",permalink:"/coinstac/developer/coinstac-setup"},next:{title:"Packages",permalink:"/coinstac/developer/packages"}},s={},l=[{value:"GUI",id:"gui",level:2},{value:"COINSTAC-simulator",id:"coinstac-simulator",level:2},{value:"COINSTAC-Vaults",id:"coinstac-vaults",level:2},{value:"API Server",id:"api-server",level:2}],p={toc:l},u="wrapper";function v(e){let{components:t,...r}=e;return(0,a.kt)(u,(0,n.Z)({},p,r,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"application-overview"},"Application overview"),(0,a.kt)("h1",{id:"main-components-and-their-packages"},"Main components and their packages"),(0,a.kt)("h2",{id:"gui"},"GUI"),(0,a.kt)("p",null,"The GUI is how researchers (our primary users) interact with the COINSTAC system to perform research."),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("a",{parentName:"li",href:"https://github.com/trendscenter/coinstac/tree/master/packages/coinstac-ui"},"coinstac-ui"))),(0,a.kt)("h2",{id:"coinstac-simulator"},"COINSTAC-simulator"),(0,a.kt)("p",null,"COINSTAC-simulator is primarly used by computation authors to develop and test their computations"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("a",{parentName:"li",href:"https://github.com/trendscenter/coinstac/tree/master/packages/coinstac-simulator"},"coinstac-simulator"))),(0,a.kt)("h2",{id:"coinstac-vaults"},"COINSTAC-Vaults"),(0,a.kt)("p",null,"COINSTAC-Vaults allow datasets to be hosted in a way that they are persistently available for analysis using COINSTAC, without the need for manual participation in consortia."),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("a",{parentName:"li",href:"https://github.com/trendscenter/coinstac/tree/master/packages/coinstac-headless-client"},"coinstac-headless-client"))),(0,a.kt)("h2",{id:"api-server"},"API Server"),(0,a.kt)("p",null,"The API server is the central COINSTAC service. It keeps track of users, pipelines, consortia, and runs.\nThe API Server hosts the GraphQL endpoints called by the UI and other services."),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("a",{parentName:"li",href:"https://github.com/trendscenter/coinstac/tree/master/packages/coinstac-api-server"},"coinstac-api-server"))))}v.isMDXComponent=!0}}]);