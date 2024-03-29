
/**
 * @file Q.js
 * @author Dimitris Vainanidis
 * @copyright Dimitris Vainanidis, 2022
 */

/* jshint ignore:start */
'use strict';



/** Returns the selected DOM elements, by ID, class, e.t.c. */
window.Q = function(selector){
    if ( document.getElementById(selector) ) {
        return document.getElementById(selector);
    }
    if ( typeof(selector) == 'string' ) {
        if (selector.startsWith('--')){return new Qcp(selector)}        // css custom property
        let modifiedSelector = (selector.charAt(0)=='~') ? '[data-variable=' + selector.substring(1) + ']' : selector;
        let q = Qarray.from([...document.querySelectorAll(modifiedSelector)]);
        q.selector = modifiedSelector;
        q.each = Q.eachProxy(q); 
        return q;
    } 
    if ( ( selector instanceof HTMLElement ) || [document,window].includes(selector) ) {
        let q = Qarray.from([selector]);
        q.selector = selector;
        return q;
    } 
    if ( Array.isArray(selector) ) {        // probably already a Qarray, e.g Q(Q(...).bar).foo 
        return selector;
    }
};


class Qcp {
    constructor(property){
        this.property = property;
        this.value = getComputedStyle(document.documentElement,null).getPropertyValue(property);
    }
    set(value){
        this.value = value;
        document.documentElement.style.setProperty(this.property, value);
        return this;
    }
}


class Qarray extends Array{
    constructor(...items) { 
        super(...items) ;
    } 

    #displayOneIf(element,condition=true ) {
        element.style.display = ( condition===true || ( (condition instanceof Function) && condition(element) ) )  ?"":"none";
    }
    display(condition){this.forEach(el=>this.#displayOneIf(el,condition));return this}       
    
    toggleClass(className,condition){this.forEach(el=>el.classList.toggle(className,condition));return this}

    #setOne(element,content,html) {         
        (element.nodeName=='INPUT')?element.value=content:      // threesome syntax
        html?element.innerHTML=content:
        element.textContent=content;
    }
    set(content,html=false){this.forEach(el=>this.#setOne(el,content,html));return this}

    // parameter = null/ommited | "live" | "once" | number -> debounce rate
    on(event,callback,parameter=null) {        
        if (!parameter){
            this.forEach(el=>el.addEventListener(event,callback));
        } else if ( parameter=="live" ) {
            document.addEventListener(event,(e)=>{
                if ( e.target.matches(this.selector) ) {
                    callback(e);
                }
            });
        } else if (parameter=="once") {
            this.forEach(el=>el.addEventListener(event,callback,{once:true}));
        } else if (parameter>=1){
            let debounceRate = parameter;
            let Qdebounce = (callbackFunction, delay=400) => {
                let timeout;
                return function(...args) {
                    clearTimeout(timeout);
                    timeout = setTimeout( ()=>{callbackFunction(...args)}, delay );
                };
            };
            this.forEach(function(el){
                let debouncedCB = Qdebounce(callback.bind(el),debounceRate);     // create debounced version of callback
                el.addEventListener(event,debouncedCB);        // use debouncedCB directly, never inside a (function) handler 
            });   
        }
        return this;
    }

    // type: "text" | "json" | "html"
    async fetch(URL,type="text",pathFunction=null) {      
        return fetch(URL) 
            .then(response=>{return type=="json"?response.json():response.text()})
            .then(data=>type=="html"?this.each.innerHTML=data:this.set(pathFunction?pathFunction(data):data))
            .then(()=>this);      // github copilot!
    }

    async post(URL,parameterName) {
        return fetch(URL, {
            method:'POST', 
            headers:{'Content-Type':'application/json'}, 
            body:JSON.stringify({[parameterName]:this[0].value}) 
        });
        // it is more useful to return the response from the server, not the element itself. 
    }

    onKeyboardPress(callback) {
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

}

Q.eachProxy = (Qarray) => {
    return new Proxy(Qarray, {                  // προσοχή, το each επηρεάζει το fetch με html (όχι με set),    
        get(o,property){
            return o.map(el=>el[property]??el.getAttribute(property));      // jshint ignore:line
        },
        set(o,property,value){
            o.forEach(el=>{
                if(property in el){el[property]=value}else{el.setAttribute(property,value)}
            });
            return value;
        },
    });
};





/**
 * Loads a .CSS or .JS file.
 * @param {URL} resourceURL Path of .js or .css file
 * @param {object} attributes Javascript-ish attributes. E.g.: crossOrigin, not crossorigin  
 */
Q.load = (resourceURL, attributes={}) => {
    if (Array.isArray(resourceURL)) {         // if array, do for each
        return Promise.all(resourceURL.map(resource=>Q.load(resource,attributes)));
    }
    let resourceExtention = resourceURL.split('.').pop();       //CSS or JS?
    switch (resourceExtention) {
        case 'css':   //remember that a new css overrides old css!!!
            return new Promise((resolve,reject) => {
                let css = document.createElement('link');
                css.type = "text/css";
                css.rel = "stylesheet";
                css.media = "screen,print";
                css.href = resourceURL;
                Object.assign(css,attributes);
                css.onload = resolve;
                css.onerror = reject;
                document.querySelector("head").appendChild( css );      // head[0]...
            });
        case 'js':
            return new Promise((resolve,reject) => {
                let js = document.createElement('script');
                js.type = "text/javascript";
                js.setAsrcttribute = resourceURL;
                js.defer = true;
                Object.assign(js,attributes);
                js.onload = resolve;
                js.onerror = reject;
                document.body.appendChild( js );
            });
        default:
            break;
        }
};

