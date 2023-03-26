
/**
 * @file Qlite.js
 * @author Dimitris Vainanidis
 * @copyright Dimitris Vainanidis, 2023
 */

/* jshint ignore:start */
'use strict';


/** 
 * Returns the selected DOM elements, by ID, class, e.t.c.  
*/
this.Q ??= (selector) => {
    if ( selector.charAt(0)=='#' ) {  
          let element = document.querySelector(selector);    
          element.on ??= function(event,callback){element.addEventListener(event,callback);return element}
          element.show ??= function(condition=true){if (condition) {element.classList.remove('d-none')} else {element.classList.add('d-none')} }
          return element;
    } else {
          if (selector.charAt(0)=='~') {selector=`[data-variable=${selector.substring(1)}]`}
          let elements = [...document.querySelectorAll(selector)];
          elements.set ??= function(content){elements.forEach(el=>el.textContent=content)}
          elements.on ??= function(event,action,options){
              if (options=="live"){
                  document.addEventListener(event,(e)=>{if(e.target.matches(selector)){action(e)}});
              } else {
                  elements.forEach(el=>el.addEventListener(event,action,options));
              }
          }
          return elements;
    }
};

