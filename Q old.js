/* jshint ignore:start */
'use strict';



/**
 * Wait for a condition to be met and, only then, continue execution of function. 
 * Use only inside async function or variable.
 * Use this way: await until(_=> flag == true);
 * @param {boolean|Function} condition Use a boolean variable or a function (that returnes true/false). Do not use condition or expression!
 * @returns {Promise} 
 */
 Q.until = condition => { 
    let checkCondition = (condition instanceof Function)?condition:()=>condition;
    const poll = resolve => {      // needs a name to re-call itself
        if (checkCondition()) {resolve()}
        else {setTimeout(_=>poll(resolve), 200)}
    };
    return new Promise(poll);
};






class Qarray extends Array{

    constructor(sourceArray) {
        super(sourceArray.length);
        // sourceArray.forEach((el,i)=>{this[i]=el});
        for (let i = 0; i < sourceArray.length; i++) {      // for each does not work here???
            this[i] = sourceArray[i];
        }
    } 

    displayOneIf(element,condition=true){
        element.style.display = ( condition===true || ( (condition instanceof Function) && condition(element) ) )  ?"":"none";
    }
    display(condition){this.forEach(el=>this.displayOneIf(el,condition));return this}          
    
    toggleClass(className,condition){this.forEach(el=>el.classList.toggle(className,condition));return this} 

    setOne(element,content,html) {         // threesome syntax
        (element.nodeName=='INPUT')?element.value=content:
        html?element.innerHTML=content:
        element.textContent=content;
    } 
    set(content,html=false){this.forEach(el=>this.setOne(el,content,html));return this} 

    on(event,callback,debounceRate=null) {        
        if (!debounceRate){
            this.forEach(el=>el.addEventListener(event,callback));
            return this;
        } else if (debounceRate>0){ // debounce only works on named (external) functions with no arguments
            let Qdebounce = (callbackFunction, delay=400) => {
                let timeout
                return (...args) => {
                  clearTimeout(timeout);
                  timeout = setTimeout( ()=>{callbackFunction(...args)}, delay );
                }
            }
            this.forEach(function(el){
                let debouncedCB = Qdebounce(callback,debounceRate);     // create debounced version of callback
                el.addEventListener(event,debouncedCB.bind(el));        // use debouncedCB directly, never inside a (function) handler 
            });
            return this;
        }
    } 

    async fetch(URL,type="text",pathFunction){      // type: "text", "json", "html"
        return fetch(URL) 
            .then(response=>{return type=="json"?response.json():response.text()})
            .then(data=>type=="html"?this.each.innerHTML=data:this.set(pathFunction?pathFunction(data):data))
            .then(()=>this);      // github copilot!
    } 

    async post (URL,parameterName){
        return fetch(URL, {
            method:'POST', 
            headers:{'Content-Type':'application/json'}, 
            body:JSON.stringify({[parameterName]:this[0].value}) 
        });
        // it is more useful to return the response from the server, not the element itself. 
    } 

    onKeyboardPress(callback){
        let KeyString = (keyEvent) => {
            let key = keyEvent.key.replace("Control", "Ctrl"); 
            if (!keyEvent.ctrlKey && !keyEvent.altKey) {return key}   
            if (key.length==1) {key=keyEvent.code.replace('Key','')}     
            let pre = '';
            if (keyEvent.altKey && key!="Alt") {pre+='Alt+'}  
            if (keyEvent.ctrlKey && key!="Ctrl") {pre+='Ctrl+'}
            if (keyEvent.shiftKey && key!="Shift") {pre+='Shift+'} 
            return pre+key;
        };
        this.forEach(el=>el.addEventListener("keydown",function(keyEvent){  
            callback(KeyString(keyEvent));
        }));
        return this;
    }

    each = new Proxy(this, {            // προσοχή, το each επηρεάζει το fetch
        get(o,property){
             return o.map(el=>el[property]??el.getAttribute(property));
        },
        set(o,property,value){
            o.forEach(el=>{
                if(property in el){el[property]=value}else{el.setAttribute(property,value)}
            });
            return value
        },
      });

}



globalThis.Q = (selector) => {
    if (document.getElementById(selector)) {
        return document.getElementById(selector)
    }
    if ( ( selector instanceof HTMLElement ) || [document,window].includes(selector) ) {
        return new Qarray([selector]) ;
    } 
    if ( typeof(selector) == 'string' ) {
        let modifiedSelector = (selector.charAt(0)=='~') ? '[data-variable=' + selector.substring(1) + ']' : selector;
        return new Qarray([...document.querySelectorAll(modifiedSelector)]);
    } 
    if (selector instanceof Qarray) {
        return selector;
    }
};

    // document.getElementById(selector) ?? new Qarray([...document.querySelectorAll((selector.charAt(0)=='~') ? '[data-variable=' + selector.substring(1) + ']' : selector)]);





/*
let Qarray = (selector) => {
    let thisQarray;
    if ( ( selector instanceof HTMLElement ) || [document,window].includes(selector) ) {
        thisQarray = [...[selector]] ;
    } else if ( typeof(selector) == 'string' ) {
        let modifiedSelector = (selector.charAt(0)=='~') ? '[data-variable=' + selector.substring(1) + ']' : selector;
        thisQarray = [...document.querySelectorAll(modifiedSelector)];
    } 


    thisQarray.on = function(event,callback,debounceRate=null) {        
        if (!debounceRate){
            this.forEach(el=>el.addEventListener(event,callback));
            return this;
        } else if (debounceRate>0){ // debounce only works on named (external) functions with no arguments
            let Qdebounce = (callbackFunction, delay=400) => {
                let timeout
                return (...args) => {
                  clearTimeout(timeout);
                  timeout = setTimeout( ()=>{callbackFunction(...args)}, delay );
                }
            }
            this.forEach(function(el){
                let debouncedCB = Qdebounce(callback,debounceRate);     // create debounced version of callback
                el.addEventListener(event,debouncedCB.bind(el));        // use debouncedCB directly, never inside a (function) handler 
            });
            return this;
        }
    }; 
    

    let setOne = (element,content,html) =>{         // threesome syntax
        (element.nodeName=='INPUT')?element.value=content:
        html?element.innerHTML=content:
        element.textContent=content;
    };
    thisQarray.set = function(content,html=false) {this.forEach(el=>setOne(el,content,html));return this};
    
    let displayOneIf = (element,condition=true) => {
        element.style.display = ( condition===true || ( (condition instanceof Function) && condition(element) ) )  ?"":"none";
    };
    thisQarray.display = function(condition) {this.forEach(el=>displayOneIf(el,condition));return this};
    
    
    thisQarray.toggleClass = function(className,condition) {this.forEach(el=>el.classList.toggle(className,condition));return this};
    
    
    thisQarray.fetch = async function(URL,pathFunction) { 
        return fetch(URL) 
            .then(response=>{try{return response.json()}catch{return response.text()}})
            .then(data=>this.set(pathFunction?pathFunction(data):data))
            .then(()=>this);      // github copilot!
    };
    thisQarray.post = async function(URL,parameterName="key") {
        let postObject = {
            method:'POST', 
            headers:{'Content-Type':'application/json'}, 
            body:JSON.stringify({[parameterName]:this[0].value}) 
        };
        console.log(postObject);
        return fetch(URL, postObject);     // it is more useful to return the response from the server, not the element itself. 
    };

    thisQarray.onKeyboardPress = function(callback) {
        let KeyString = (keyEvent) => {
            let key = keyEvent.key.replace("Control", "Ctrl"); 
            if (!keyEvent.ctrlKey && !keyEvent.altKey) {return key}   
            if (key.length==1) {key=keyEvent.code.replace('Key','')}     
            let pre = '';
            if (keyEvent.altKey && key!="Alt") {pre+='Alt+'}  
            if (keyEvent.ctrlKey && key!="Ctrl") {pre+='Ctrl+'}
            if (keyEvent.shiftKey && key!="Shift") {pre+='Shift+'} 
            return pre+key;
        };
        this.forEach(el=>el.addEventListener("keydown",function(keyEvent) {  
            callback(KeyString(keyEvent));
        }));
        return this;
    };


    // return Qarray;       // not. Istead, return proxy
    // The property/attribute Proxy
    return new Proxy(thisQarray, {
        get(thisQarray,property){
            if (property in thisQarray) { return thisQarray[property] }     // όχι o.hasOwnProperty(property) διότι δεν κοιτάει proto, px length
            else { return thisQarray.map(el=>el[property]??el.getAttribute[property]) }    
        },
        set(thisQarray,property,value){
            if (property in thisQarray) { thisQarray[property]=value } // if array property
            else { thisQarray.forEach(el=>{
                if(property in el){el[property]=value}
                else{el.setAttribute(property,value)}
            })}
            return value;
        },   
    });


};



globalThis.Q = (selector) => document.getElementById(selector) || Qarray(selector);
*/


/*
class Qarray extends Array{

    constructor(selector) {
        // console.log(...arguments);
        if ( ( selector instanceof HTMLElement ) || [document,window].includes(selector) ) {
            super(...[selector]) ;
            this.itself = selector;
        } else if ( typeof(selector) == 'string' ) {
            let modifiedSelector = (selector.charAt(0)=='~') ? '[data-variable=' + selector.substring(1) + ']' : selector;
            super(...document.querySelectorAll(modifiedSelector));
            this.itself = (selector.charAt(0)=='#') ? this[0] : [...this];
        } 

        // this.selector = selector;
        
        
        // return new Proxy(this, {
        //     get(thisQarray,property,receiver){
        //         if (property==="get"){return [...thisQarray]}
        //         if (property in thisQarray) {return thisQarray[property]}     //όχι o.hasOwnProperty(property) διότι δεν κοιτάει proto, px length
        //         else { return [...thisQarray].map(el=>el[property]??el.getAttribute[property]) }    
        //     },
        //     set(thisQarray,property,value){
        //         if (property in thisQarray) {thisQarray[property]=value} //if array property
        //         else { [...thisQarray].forEach(el=>{
        //             if(property in el){el[property]=value}
        //             else{el.setAttribute(property,value)}
        //         })}
        //         return value;
        //     },   
        // });
        

    }

    // map(fun) {return [...this].map(fun)}

    #displayOneIf(element,condition=true){
        element.style.display = ( condition===true || ( (condition instanceof Function) && condition(element) ) )  ?"":"none";
    }
    display(condition){this.forEach(el=>this.#displayOneIf(el,condition));return this.itself}          
    
    toggleClass(className,condition){this.forEach(el=>el.classList.toggle(className,condition));return this.itself} 

    #setOne(element,content,html) {         // threesome syntax
        (element.nodeName=='INPUT')?element.value=content:
        html?element.innerHTML=content:
        element.textContent=content;
    } 
    set(content,html=false){this.forEach(el=>this.#setOne(el,content,html));return this.itself} 

    on(event,callback){this.forEach(el=>el.addEventListener(event,callback));return this.itself} 

    async fetch(URL,pathFunction){ 
        return fetch(URL) 
            .then(response=>{try{return response.json()}catch{return response.text()}})
            .then(data=>this.set(pathFunction?pathFunction(data):data))
            .then(()=>this.itself);      // github copilot!
    } 

    async post (URL,parameterName){
        return fetch(URL, {
            method:'POST', 
            headers:{'Content-Type':'application/json'}, 
            body:JSON.stringify({[parameterName]:this[0].value}) 
        });
        // it is more useful to return the response from the server, not the element itself. 
    } 

    onKeyboardPress(callback){
        let KeyString = (keyEvent) => {
            let key = keyEvent.key.replace("Control", "Ctrl"); 
            if (!keyEvent.ctrlKey && !keyEvent.altKey) {return key}   
            if (key.length==1) {key=keyEvent.code.replace('Key','')}     
            let pre = '';
            if (keyEvent.altKey && key!="Alt") {pre+='Alt+'}  
            if (keyEvent.ctrlKey && key!="Ctrl") {pre+='Ctrl+'}
            if (keyEvent.shiftKey && key!="Shift") {pre+='Shift+'} 
            return pre+key;
        };
        this.forEach(el=>el.addEventListener("keydown",function(keyEvent){  
            callback(KeyString(keyEvent));
        }));
        return this.itself;
    }
}

// globalThis.Q = (selector) => document.getElementById(selector) || new Qarray(selector);
*/


// τα properties
// το chaining στα # (στα άλλα λειτουργεί οκ). θα επιστρέφει το array ή το element?


/*
function debounce(callbackFunction, delay = 1000) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        callbackFunction(...args);
      }, delay);
    };
}
*/



// this.Qmap = new Map();

//TODO: window and document. τα υπόλοιπα οκ
/*
this.Q = (selector) =>    
    Qmap.get(selector) 
    ?? document.getElementById(selector) 
    ?? (
    ( selector instanceof HTMLElement ) ? new Qelement(selector) :
    ( typeof(selector) != 'string' ) ? selector :       // threesome structure
    ( selector.charAt(0)=='#' && !selector.includes(' ') ) ? new Qelement(selector) : 
    new Qarray(selector)
    );
*/



/*

class extendedArray extends Array {
    constructor(...args) {
      super(...args);
    }
}

globalThis.myArr = new extendedArray(1,2,3);



class ExampleArray extends Array {
    constructor(...args) {
      super(...args);
    }
  }
  
  const exampleArray = new ExampleArray(3, 4, 5, 6, 7);
  
  // true, filtering will result in 3 items
  console.log(
    exampleArray
      .filter(e => e > 4)
  );
  
  // false, filtering will result in zero items
  console.log(
    exampleArray
      .filter(e => e > 10)
  );
  
  // true, is an ExampleArray
  console.log(
    exampleArray
      .map(e => e * 2)
  );





  const spy =
  (arr) =>
    new Proxy(arr, {
      get(target, prop) {
        if (prop === "max") {
          return Math.max(...target);
        }
        if (prop === "min") {
          return Math.min(...target);
        }
        return target[prop];
      }
    });


globalThis.arr = spy([1,2,3], () => console.log('spied'));
*/