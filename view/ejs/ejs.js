/*jslint evil: true */
steal('can/view', 'can/util/string/rsplit').then(function( $ ) {

	// HELPER METHODS ==============
	var myEval = function( script ) {
		eval(script);
	},
		// removes the last character from a string
		// this is no longer needed
		// chop = function( string ) {
		//	return string.substr(0, string.length - 1);
		//},
		rSplit = Can.String.rsplit,
		extend = Can.extend,
		isArray = Can.isArray,
		// regular expressions for caching
		returnReg = /\r\n/g,
		retReg = /\r/g,
		newReg = /\n/g,
		nReg = /\n/,
		slashReg = /\\/g,
		quoteReg = /"/g,
		singleQuoteReg = /'/g,
		tabReg = /\t/g,
		leftBracket = /\{/g,
		rightBracket = /\}/g,
		quickFunc = /\s*\(([\$\w]+)\)\s*->([^\n]*)/,
		tagMap = {"": "span", table: "tr", tr: "td", ol: "li", ul: "li", tbody: "tr", thead: "tr", tfoot: "tr"},
		// escapes characters starting with \
		clean = function( content ) {
			return content.replace(slashReg, '\\\\').replace(newReg, '\\n').replace(quoteReg, '\\"').replace(tabReg, '\\t');
		},
		// escapes html
		// - from prototype  http://www.prototypejs.org/
		escapeHTML = function( content ) {
			return content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(quoteReg, '&#34;').replace(singleQuoteReg, "&#39;");
		},
		$View = Can.View,
		bracketNum = function(content){
			var lefts = content.match(leftBracket),
				rights = content.match(rightBracket);
				
			return (lefts ? lefts.length : 0) - 
				   (rights ? rights.length : 0);
		},
		batchedUpdates = [],
		batchTimerId = null,
		batch = function(update) {
			clearTimeout(batchTimerId);
			//keep batched updates unique
			var updatePos = Can.inArray(update, batchedUpdates);
			updatePos === -1 ? batchedUpdates.push(update) : batchedUpdates[updatePos] = update;
			batchTimerId = setTimeout(function(){
				Can.each(batchedUpdates, function(i, bu){
					bu();
				})
				batchedUpdates = [];
			}, 1)
		}
		// used to bind to an observe, and unbind when the element is removed
		liveBind = function(observed, el, cb){
			Can.each(observed, function(i, ob){
				ob.cb = function(){
					//batch(cb);
					cb()
				}
				ob.obj.bind(ob.attr, ob.cb)
			})
			Can.bind.call(el,'destroyed', function(){
				Can.each(observed, function(i, ob){
					ob.obj.unbind(ob.attr, ob.cb)
				})
			})
		},
		// gets observes
		observes = function(self, func){
			var observed = [],
				val;
			if (Can.Observe) {
				Can.Observe.__reading = function(obj, attr){
					observed.push({
						obj: obj,
						attr: attr
					})
				}
			}
			val = func.call(self);
			if(Can.Observe){
				delete Can.Observe.__reading;
			}
			return {
				observes: observed,
				val: val
			};
		},
		/**
		 * @class Can.EJS
		 * 
		 * @plugin jquery/view/ejs
		 * @parent Can.View
		 * @download  http://jmvcsite.heroku.com/pluginify?plugins[]=jquery/view/ejs/ejs.js
		 * @test jquery/view/ejs/qunit.html
		 * 
		 * 
		 * Ejs provides <a href="http://www.ruby-doc.org/stdlib/libdoc/erb/rdoc/">ERB</a> 
		 * style client side templates.  Use them with controllers to easily build html and inject
		 * it into the DOM.
		 * 
		 * ###  Example
		 * 
		 * The following generates a list of tasks:
		 * 
		 * @codestart html
		 * &lt;ul>
		 * &lt;% for(var i = 0; i < tasks.length; i++){ %>
		 *     &lt;li class="task &lt;%= tasks[i].identity %>">&lt;%= tasks[i].name %>&lt;/li>
		 * &lt;% } %>
		 * &lt;/ul>
		 * @codeend
		 * 
		 * For the following examples, we assume this view is in <i>'views\tasks\list.ejs'</i>.
		 * 
		 * 
		 * ## Use
		 * 
		 * ### Loading and Rendering EJS:
		 * 
		 * You should use EJS through the helper functions [jQuery.View] provides such as:
		 * 
		 *   - [jQuery.fn.after after]
		 *   - [jQuery.fn.append append]
		 *   - [jQuery.fn.before before]
		 *   - [jQuery.fn.html html], 
		 *   - [jQuery.fn.prepend prepend],
		 *   - [jQuery.fn.replaceWith replaceWith], and 
		 *   - [jQuery.fn.text text].
		 * 
		 * or [jQuery.Controller.prototype.view].
		 * 
		 * ### Syntax
		 * 
		 * EJS uses 5 types of tags:
		 * 
		 *   - <code>&lt;% CODE %&gt;</code> - Runs JS Code.
		 *     For example:
		 *     
		 *         <% alert('hello world') %>
		 *     
		 *   - <code>&lt;%= CODE %&gt;</code> - Runs JS Code and writes the _escaped_ result into the result of the template.
		 *     For example:
		 *     
		 *         <h1><%= 'hello world' %></h1>
		 *         
		 *   - <code>&lt;%== CODE %&gt;</code> - Runs JS Code and writes the _unescaped_ result into the result of the template.
		 *     For example:
		 *     
		 *         <h1><%== '<span>hello world</span>' %></h1>
		 *         
		 *   - <code>&lt;%%= CODE %&gt;</code> - Writes <%= CODE %> to the result of the template.  This is very useful for generators.
		 *     
		 *         <%%= 'hello world' %>
		 *         
		 *   - <code>&lt;%# CODE %&gt;</code> - Used for comments.  This does nothing.
		 *     
		 *         <%# 'hello world' %>
		 *        
		 * ## Hooking up controllers
		 * 
		 * After drawing some html, you often want to add other widgets and plugins inside that html.
		 * View makes this easy.  You just have to return the Contoller class you want to be hooked up.
		 * 
		 * @codestart
		 * &lt;ul &lt;%= Mxui.Tabs%>>...&lt;ul>
		 * @codeend
		 * 
		 * You can even hook up multiple controllers:
		 * 
		 * @codestart
		 * &lt;ul &lt;%= [Mxui.Tabs, Mxui.Filler]%>>...&lt;ul>
		 * @codeend
		 * 
		 * To hook up a controller with options or any other jQuery plugin use the
		 * [jQuery.EJS.Helpers.prototype.plugin | plugin view helper]:
		 * 
		 * @codestart
		 * &lt;ul &lt;%= plugin('mxui_tabs', { option: 'value' }) %>>...&lt;ul>
		 * @codeend
		 * 
		 * Don't add a semicolon when using view helpers.
		 * 
		 * 
		 * <h2>View Helpers</h2>
		 * View Helpers return html code.  View by default only comes with 
		 * [jQuery.EJS.Helpers.prototype.view view] and [jQuery.EJS.Helpers.prototype.text text].
		 * You can include more with the view/helpers plugin.  But, you can easily make your own!
		 * Learn how in the [jQuery.EJS.Helpers Helpers] page.
		 * 
		 * @constructor Creates a new view
		 * @param {Object} options A hash with the following options
		 * <table class="options">
		 *     <tbody><tr><th>Option</th><th>Default</th><th>Description</th></tr>
		 *     <tr>
		 *      <td>text</td>
		 *      <td>&nbsp;</td>
		 *      <td>uses the provided text as the template. Example:<br/><code>new View({text: '&lt;%=user%>'})</code>
		 *      </td>
		 *     </tr>
		 *     <tr>
		 *      <td>type</td>
		 *      <td>'<'</td>
		 *      <td>type of magic tags.  Options are '&lt;' or '['
		 *      </td>
		 *     </tr>
		 *     <tr>
		 *      <td>name</td>
		 *      <td>the element ID or url </td>
		 *      <td>an optional name that is used for caching.
		 *      </td>
		 *     </tr>
		 *    </tbody></table>
		 */
		EJS = function( options ) {
			if ( this.constructor != EJS ) {
				var ejs = new EJS(options);
				return function( data, helpers ) {
					return ejs.render(data, helpers);
				};
			}
			// if we get a function directly, it probably is coming from
			// a steal-packaged view
			if ( typeof options == "function" ) {
				this.template = {
					fn: options
				};
				return;
			}
			//set options on self
			extend(this, EJS.options, options);
			this.template = scan(this.text, this.name);
		};
	// add EJS to jQuery if it exists
	Can.EJS = EJS;
	/** 
	 * @Prototype
	 */
	EJS.prototype.
	/**
	 * Renders an object with view helpers attached to the view.
	 * 
	 *     new EJS({text: "<%= message %>"}).render({
	 *       message: "foo"
	 *     },{helper: function(){ ... }})
	 *     
	 * @param {Object} object data to be rendered
	 * @param {Object} [extraHelpers] an object with view helpers
	 * @return {String} returns the result of the string
	 */
	render = function( object, extraHelpers ) {
		object = object || {};
		this._extra_helpers = extraHelpers;
		var v = new EJS.Helpers(object, extraHelpers || {});
		return this.template.fn.call(object, object, v);
	};
	/**
	 * @Static
	 */
	extend(EJS, {
		/**
		 * @hide
		 * called to setup unescaped text
		 * @param {Number|String} status
		 *   - "string" - the name of the attribute  <div string="HERE">
		 *   - 1 - in an html tag <div HERE></div>
		 *   - 0 - in the content of a tag <div>HERE</div>
		 *   
		 * @param {Object} self
		 * @param {Object} func
		 */
		txt : function(tagName, status, self, func){
			if(status  !== 0){
				return EJS.esc(tagName, status, self, func)
			}
			var obs = observes(self, func),
				observed = obs.observes,
				input = obs.val;
			if(!obs.observes.length){
				return EJS.text(obs.val)
			}
			
			return "<" +(tagMap[tagName] || "span")+" data-view-id='" + $View.hookup(function(span){
					// remove child, bind on parent
					var makeAndPut = function(val, remove){
							// get fragement of html to fragment
							var frag = Can.view.frag(val),
								// wrap it to keep a reference to the elements .. 
								nodes = Can.$(Can.map(frag.childNodes,function(node){
									return node;
								})),
								last = remove[remove.length - 1];
							
							// insert it in the document
							if( last.nextSibling ){
								last.parentNode.insertBefore(frag, last.nextSibling)
							} else {
								last.parentNode.appendChild(frag)
							}
							
							// remove the old content
							Can.remove( Can.$(remove) );
							//Can.view.hookup(nodes);
							return nodes;
						},
						nodes = makeAndPut(input, [span]);
					// listen to changes and update
					// make sure the parent does not die
					// we might simply check that nodes is still in the document 
					// before a write ...
					liveBind(observed, span.parentNode, function(){
						nodes = makeAndPut(func.call(self), nodes);
					});
					//return parent;
			}) + "'></" +( tagMap[tagName] || "span")+">";
			
		},
		// called to setup escaped text
		esc : function(tagName, status, self, func){
			var obs = observes(self, func),
				observed = obs.observes,
				input = obs.val;

			if(!observed.length){
				return EJS.clean(input)
			}
			// handle hookup cases
			
			if(status === 0){ // we are in between html tags
				// return a span with a hookup function ...
				return "<" +(tagMap[tagName] || "span")+" data-view-id='" + $View.hookup(function(el){
					// remove child, bind on parent
					var parent = el.parentNode,
						node = document.createTextNode(input);
					
					parent.insertBefore(node, el);
					parent.removeChild(el);
					
					// create textNode
					liveBind(observed, parent, function(){
						node.nodeValue = func.call(self)
					})
				}) + "'></" +(tagMap[tagName] || "span")+">";
				
			} else if(status === 1){ // in a tag
				// TODO: handle within a tag <div <%== %>>
				return input;
				// mark at end!
			} else { // in an attribute
				pendingHookups.push(function(el){
					var wrapped = Can.$(el),
						hooks
						
					(hooks = Can.data(wrapped,'hooks')) || Can.data(wrapped, 'hooks', hooks = {}),
					attr = el.getAttribute(status),
					parts = attr.split("__!@#$%__");

					if(hooks[status]) {
						hooks[status].funcs.push(func);
					}
					else {
						var me = {
							render: function() {
								for(var i = 0; i < hooks[status].funcs.length; i++) {
									attr = attr.replace(/__!@#\$%__/, function() {
										return hooks[status].funcs[i].call(self);
									});
								}

								return attr;
							},
							
							funcs: [func]
						};

						hooks[status] = me;
					}

					parts.splice(1,0,input)
					el.setAttribute(status, parts.join(""))
					
					liveBind(observed, el, function() {
						el.setAttribute(status, hooks[status].render());
					})
				})
				return "__!@#$%__";
			}
		},
		/**
		 * Used to convert what's in &lt;%= %> magic tags to a string
		 * to be inserted in the rendered output.
		 * 
		 * Typically, it's a string, and the string is just inserted.  However,
		 * if it's a function or an object with a hookup method, it can potentially be 
		 * be ran on the element after it's inserted into the page.
		 * 
		 * This is a very nice way of adding functionality through the view.
		 * Usually this is done with [jQuery.EJS.Helpers.prototype.plugin]
		 * but the following fades in the div element after it has been inserted:
		 * 
		 * @codestart
		 * &lt;%= function(el){$(el).fadeIn()} %>
		 * @codeend
		 * 
		 * @param {String|Object|Function} input the value in between the
		 * write magic tags: &lt;%= %>
		 * @return {String} returns the content to be added to the rendered
		 * output.  The content is different depending on the type:
		 * 
		 *   * string - the original string
		 *   * null or undefined - the empty string ""
		 *   * an object with a hookup method - the attribute "data-view-id='XX'", where XX is a hookup number for jQuery.View
		 *   * a function - the attribute "data-view-id='XX'", where XX is a hookup number for jQuery.View
		 *   * an array - the attribute "data-view-id='XX'", where XX is a hookup number for jQuery.View
		 */
		text: function( input ) {	
			
			// if it's a string, return
			if ( typeof input == 'string' ) {
				return input;
			}
			// if has no value
			if ( input === null || input === undefined ) {
				return '';
			}

			// if it's an object, and it has a hookup method
			var hook = (input.hookup &&
			// make a function call the hookup method

			function( el, id ) {
				input.hookup.call(input, el, id);
			}) ||
			// or if it's a function, just use the input
			(typeof input == 'function' && input);
			// finally, if there is a funciton to hookup on some dom
			// pass it to hookup to get the data-view-id back
			if ( hook ) {
				return "data-view-id='" + $View.hookup(hook) + "'";
			}
			// finally, if all else false, toString it
			return input.toString ? input.toString() : "";
		},
		pending: function() {
			if(pendingHookups.length) {
				var hooks = pendingHookups.slice(0);

				pendingHookups = [];
				return " data-view-id='" + $View.hookup(function(el){
					Can.each(hooks, function(i, fn){
						fn(el);
					})
				}) + "'";
			}else {
				return "";
			}
		},
		/**
		 * Escapes the text provided as html if it's a string.  
		 * Otherwise, the value is passed to EJS.text(text).
		 * 
		 * @param {String|Object|Array|Function} text to escape.  Otherwise,
		 * the result of [jQuery.EJS.text] is returned.
		 * @return {String} the escaped text or likely a Can.View data-view-id attribute.
		 */
		clean: function( text ) {
			//return sanatized text
			if ( typeof text == 'string' ) {
				return escapeHTML(text);
			} else if ( typeof text == 'number' ) {
				return text;
			} else {
				return EJS.text(text);
			}
		}
});
	// ========= SCANNING CODE =========
	var tokenReg = new RegExp("(" +["<%%","%%>","<%==","<%=","<%#","<%","%>","<",">",'"',"'"].join("|")+")"),
		// commands for caching
		put_cmd = "___v1ew.push(",
		insert_cmd = put_cmd,
		startTxt = 'var ___v1ew = [];',
		finishTxt = "return ___v1ew.join('')",
		htmlTag =null,
		quote = null,
		beforeQuote = null,
		// used to mark where the element is
		status = function(){
			// t - 1
			// h - 0
			// q - string beforeQuote
			return quote ? "'"+beforeQuote.match(/([^\s]+)=$/)[1]+"'" : (htmlTag ? 1 : 0)
		},
		pendingHookups = [],
		scan = function(source, name){
			var tokens = source.replace(returnReg, "\n")
				.replace(retReg, "\n")
				.split(tokenReg),
				content = '',
				buff = [startTxt],
				put = function( content, bonus ) {
					buff.push(put_cmd, '"', clean(content), '"'+(bonus||'')+');');
				},
				// a stack used to keep track of how we should end a bracket }
				// once we have a <%= %> with a leftBracket
				// we store how the file should end here (either '))' or ';' )
				endStack =[],
				lastToken,
				startTag = null,
				magicInTag = false,
				tagName = '';

			// re-init the tag state goodness
			htmlTag = quote = beforeQuote = null;

			for (var i = 0, token; (token = tokens[i++]) !== undefined;) {

				if ( startTag === null ) {
					switch ( token ) {
					case '<%':
					case '<%=':
					case '<%==':
						magicInTag = true;
					case '<%#':
						// a new line, just add whatever content w/i a clean
						// reset everything
						startTag = token;
						if ( content.length > 0 ) {
							put(content);
						}
						content = '';
						break;

					case '<%%':
						// replace <%% with <%
						content += '<%';
						break;
					case '<':
						htmlTag = '<'
						content += token;
						magicInTag = false;
						break;
					case '>':
						htmlTag = null;
						// TODO: all <%= in tags should be added to pending hookups
						if(magicInTag){
							put(content, ",Can.EJS.pending(),\">\"");
							content = '';
						} else {
							content += token;
						}
						
						break;
					case "'":
					case '"':
						if(htmlTag){
							if(quote && quote === token){
								quote = null;
							} else if(quote === null){
								quote = token;
								beforeQuote = lastToken;
							}
						}
					default:
						if(lastToken === '<'){
							tagName = token.split(' ')[0];
						}
						content += token;
						break;
					}
				}
				else {
					//we have a start tag
					switch ( token ) {
					case '%>':
						// %>
						switch ( startTag ) {
						case '<%':
							// <%
							
							// get the number of { minus }
							bracketCount = bracketNum(content);
							
							// we are ending a block
							if (bracketCount == 1) {
								// we are starting on
								buff.push(insert_cmd, "Can.EJS.txt('"+tagName+"'," + status() + ",this,function(){", startTxt, content);
								
								endStack.push({
									before: "",
									after: finishTxt+"}));/*ft*/"
								})
							}
							else {
								
								// how are we ending this statement
								var last = // if the stack has value and we are ending a block
									 endStack.length && bracketCount == -1 ? // use the last item in the block stack
									 endStack.pop() : // or use the default ending
								{
									after: ";"
								};
								
								// if we are ending a returning block
								// add the finish text which returns the result of the
								// block 
								if (last.before) {
									buff.push(last.before)
								}
								// add the remaining content
								buff.push(content, ";",last.after);
							}
							break;
						case '<%=':
						case '<%==':
							// <%== content
							// - we have an extra { -> block
							// get the number of { minus } 
							bracketCount = bracketNum(content);
							// if we have more {, it means there is a block
							if( bracketCount ){
								// when we return to the same # of { vs } end wiht a doubleParen
								endStack.push({
									before : finishTxt,
									after: "}));"
								})
							} 
							// check if its a func like ()->
							if(quickFunc.test(content)){
								var parts = content.match(quickFunc)
								content = "function(__){var "+parts[1]+"=Can.$(__);"+parts[2]+"}"
							}
							
							// if we have <%== a(function(){ %> then we want
							//  Can.EJS.text(0,this, function(){ return a(function(){ var _v1ew = [];
							buff.push(insert_cmd, "Can.EJS."+(startTag === '<%=' ? "esc" : "txt")+"('"+tagName+"'," + status()+",this,function(){ return ", content, 
								// if we have a block
								bracketCount ? 
								// start w/ startTxt "var _v1ew = [];"
								startTxt : 
								// if not, add doubleParent to close push and text
								"}));"
								);
							break;
						}
						startTag = null;
						content = '';
						break;
					case '<%%':
						content += scanner.right;
						break;
					default:
						content += token;
						break;
					}
					
				}
				lastToken = token;
			}
			
			// put it together ..
			
			if ( content.length > 0 ) {
				// Should be content.dump in Ruby
				buff.push(put_cmd, '"', clean(content) + '")');
			}
			buff.push(";")
			
			var template = buff.join(''),
				out = {
					out: 'try { with(_VIEW) { with (_CONTEXT) {' + template + " "+finishTxt+"}}}catch(e){e.lineNumber=null;throw e;}"
				};
			//use eval instead of creating a function, b/c it is easier to debug
			myEval.call(out, 'this.fn = (function(_CONTEXT,_VIEW){' + out.out + '});\r\n//@ sourceURL=' + name + ".js");
			return out;
		};
	
	

	/**
	 * @class Can.EJS.Helpers
	 * @parent Can.EJS
	 * By adding functions to Can.EJS.Helpers.prototype, those functions will be available in the 
	 * views.
	 * 
	 * The following helper converts a given string to upper case:
	 * 
	 * 	Can.EJS.Helpers.prototype.toUpper = function(params)
	 * 	{
	 * 		return params.toUpperCase();
	 * 	}
	 * 
	 * Use it like this in any EJS template:
	 * 
	 * 	<%= toUpper('javascriptmvc') %>
	 * 
	 * To access the current DOM element return a function that takes the element as a parameter:
	 * 
	 * 	Can.EJS.Helpers.prototype.upperHtml = function(params)
	 * 	{
	 * 		return function(el) {
	 * 			$(el).html(params.toUpperCase());
	 * 		}
	 * 	}
	 * 
	 * In your EJS view you can then call the helper on an element tag:
	 * 
	 * 	<div <%= upperHtml('javascriptmvc') %>></div>
	 * 
	 * 
	 * @constructor Creates a view helper.  This function 
	 * is called internally.  You should never call it.
	 * @param {Object} data The data passed to the 
	 * view.  Helpers have access to it through this._data
	 */
	EJS.Helpers = function( data, extras ) {
		this._data = data;
		this._extras = extras;
		extend(this, extras);
	};
	/**
	 * @prototype
	 */
	EJS.Helpers.prototype = {
		/**
		 * Renders a partial view.  This is deprecated in favor of <code>Can.View()</code>.
		 */
		view: function( url, data, helpers ) {
			helpers = helpers || this._extras;
			data = data || this._data;
			return $View(url, data, helpers); //new EJS(options).render(data, helpers);
		},
		list : function(list, cb){
			list.attr('length')
			for(var i = 0, len = list.length; i < len; i++){
				cb(list[i], i, list)
			}
		}
	};

	// options for steal's build
	Can.View.register({
		suffix: "ejs",
		//returns a function that renders the view
		script: function( id, src ) {
			return "Can.EJS(function(_CONTEXT,_VIEW) { " + new EJS({
				text: src,
				name: id
			}).template.out + " })";
		},
		renderer: function( id, text ) {
			return EJS({
				text: text,
				name: id
			});
		}
	});
});