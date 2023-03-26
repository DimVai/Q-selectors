
/**
 * @file Qenhance.js
 * @author Dimitris Vainanidis
 * @copyright Dimitris Vainanidis, 2022
 */


'use strict';


globalThis.Q = function(selector){
    if ( document.getElementById(selector) ) {
        return document.getElementById(selector);
    }
    if ( typeof(selector) == 'string' ) {
        let modifiedSelector = (selector.charAt(0)=='~') ? '[data-variable=' + selector.substring(1) + ']' : selector;
        return Q.enhance([...document.querySelectorAll(modifiedSelector)],selector);
    } 
    if ( ( selector instanceof HTMLElement ) || [document,window].includes(selector) ) {
        return Q.enhance([selector],selector);
    } 
    if ( Array.isArray(selector) ) {        // probably already a Qarray, e.g Q(Q(...).bar).foo 
        return selector;
    }
};






Q.enhance = function(array,selector){
    // if it is already a Qarray, it already has a selector, each e.t.c.
    array.selector ??= selector;        // jshint ignore:line
    array.each ??= Q.eachProxy(array);  // jshint ignore:line
    return Object.assign(array,this.methods);       
};


Q.methods = {

    displayOneIf(element,condition=true ){
        element.style.display = ( condition===true || ( (condition instanceof Function) && condition(element) ) )  ?"":"none";
    },
    display(condition){this.forEach(el=>this.displayOneIf(el,condition));return this},        
    
    toggleClass(className,condition){this.forEach(el=>el.classList.toggle(className,condition));return this},

    setOne(element,content,html) {         // threesome syntax
        (element.nodeName=='INPUT')?element.value=content:
        html?element.innerHTML=content:
        element.textContent=content;
    },
    set(content,html=false){this.forEach(el=>this.setOne(el,content,html));return this},

    on(event,callback,parameter=null) {        
        if (!parameter){
            this.forEach(el=>el.addEventListener(event,callback));
        } else if ( ["live","global"].includes(parameter) ) {
            document.addEventListener(event,(e)=>{
                if ( e.target.matches(this.selector) ) {
                    callback(e);
                }
            });
        } else if (parameter>10){
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
    },

    async fetch(URL,type="text",pathFunction=null){      // type: "text", "json", "html"
        return fetch(URL) 
            .then(response=>{return type=="json"?response.json():response.text()})
            .then(data=>type=="html"?this.each.innerHTML=data:this.set(pathFunction?pathFunction(data):data))
            .then(()=>this);      // github copilot!
    },

    async post (URL,parameterName){
        return fetch(URL, {
            method:'POST', 
            headers:{'Content-Type':'application/json'}, 
            body:JSON.stringify({[parameterName]:this[0].value}) 
        });
        // it is more useful to return the response from the server, not the element itself. 
    },

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
    },

    // each: new Proxy(this, { ... }), παλιός τρόπος. Όμως, δεν δουλεύει το this μέσα σε property (παρά μόνο μέσα σε method)
    // υπάρχει και αλλος τρόπος ορισμού property, με get each() (το οποίο δημιουργεί .each property με βάση function)
    // Όμως, τώρα το this είναι το Q.methods, όχι το Qarray διότι (εφόσον το each δεν θα είναι method αλλά property) το "this"
    // γίνεται evaluate τώρα που θα οριστεί, όχι όταν εκτελεστεί... Θα δούλευε αν έμπαινε απευθείας στο object και όχι με Object.assign 
    
};

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

