
/**
 * @file lightgen.js
 * @author Dimitris Vainanidis
 * @copyright Dimitris Vainanidis, 2022
 */


// jshint ignore:start
"use strict"; 


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////                 CUSTOM ELEMENTS              //////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


/**
 * Creates a custom HTML Element
 * @param {object} component An object containing the appropriate information
 * @param {string} component.element The HTML tag for the custom element
 * @param {boolean} [component.shadowRoot] If the custom element uses shadowRoot or not
 * @param {string[]} [component.attributes] The HTML attributes to take into account
 * @param {string[]} [component.state] The HTML attributes that cause element to re-render on change
 * @param {object} [component.defaultValues] Default values for all the HTML attributes
 * @param {boolean} [component.fullRenderOnChange] Set to true only if there are problems (e.g. if event listeners disappear)
 * @param {string} component.template The HTML template of the element in string format
 * @param {function} [component.onRender] function to call on (re)render
 * @returns {object}
 */
 window.GenerateCustomElement ??= component => {        
  
    customElements.define(component.element, class extends HTMLElement {
      constructor() {
          super();
          this.hasInitialized = false;
          this.stateVariables = component.state??[]; 
          this.defaultValues = component.defaultValues??{};
          /** this.template will have th html that has has replaced attributes and slots, but not state *///
          this.template = document.createElement("template");
          this.template.innerHTML = (component.template??'')
                .replaceAll(`{slot}`,this.innerHTML)
                .replace(/<slot.{0,3}>/g,this.innerHTML); 
          this.elementAttributes = component.attributes??[];
          // get, set for all attributes (silent & state)
          for (let stateVariable of [...this.stateVariables,...this.elementAttributes]) {
              Object.defineProperty(this, stateVariable, {
                  // false ώστε να βγάζει λάθος αν silent και state ταυτόχρονα
                  // θα αντικατασταθεί και δεν θα δουλεύει ως state, οπότε να προειδοποιηθεί ο χρήστης... 
                  configurable: false,
                  get: function(){
                    return this.getAttribute(stateVariable)??this.defaultValues?.[stateVariable]??null;
                  },
                  set: function(value){
                    this.setAttribute(stateVariable,value);
                    return value;
                  },
              });
          }
          this.onRender = component.onRender;
          if (component.shadowRoot) { this.attachShadow({mode:"open"}) }
      } // end of constructor
      connectedCallback () {
          if (this.shadowRoot) { this.shadowRoot.appendChild(this.template.content.cloneNode(true)) }
          this.render("connectedCallback");
          this.update = (component.fullRenderOnChange) ? this.render : this.updateAttribute;
          this.hasInitialized = true;
      }
      static observedAttributes = component.state; //this.stateVariables does not work...
      attributeChangedCallback (attributeName, oldValue, newValue) {
            if (this.hasInitialized) {
                // console.log('attributeChangedCallback was called for: ',attributeName, oldValue, newValue)
                this.update(attributeName);
            }
      }
      render(attributeName) {
          // console.trace("render called: ",attributeName)
          this.innerHTML = ''; // empty and delete children? (and remove eventlisteners), slows browser
          if (!this.hasInitialized) {for (let attr of this.elementAttributes) {
              this.template.innerHTML = this.replaceProp(this.template.innerHTML,attr);
          }}
          let html = this.template.innerHTML;
          this.stateVariables.forEach(prop=>{
              html = this.replaceProp(html,prop);
          });
          (this.shadowRoot??this).innerHTML = html;
          this.onRender(this);
       }
       updateAttribute(attributeName){
          // console.trace("updade called:", attributeName)
          this.template.content.querySelectorAll('*').forEach((subElement,index)=>{
           if (subElement.outerHTML.includes(attributeName)) {
              // console.log(subElement,index);
              try{(this.shadowRoot??this).querySelectorAll('*')[index].outerHTML = this.replaceProp(subElement.outerHTML,attributeName)}
             catch{(this.shadowRoot??this).querySelectorAll('*')[index].innerHTML = this.replaceProp(subElement.innerHTML,attributeName)}
           }
         });
       }
       replaceProp(element,propName){
         let thisObject = this;     //this is not needed. to be tested... 
         return element.replaceAll(`{${propName}}`, thisObject.getAttribute(propName)??thisObject.defaultValues?.[propName]??'')
       }
    });
  
    return component;
} // end of CreateCustomElement

