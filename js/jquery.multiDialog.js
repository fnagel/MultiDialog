/*!
 * jQuery MultiDialog Beta2
 *
 * Copyright 2012-2013, Felix Nagel, http://www.felixnagel.com
 * Licensed under the GPL Version 3 license.
 *
 * http://fnagel.github.com/MultiDialog/
*/
/*
 * Depends:
 *  jquery.js
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 *	jquery.ui.position.js
 *	jquery.ui.dialog.js
 *	jquery.ui.dialog.extended.js
 *	jquery.ui.effects-fade.js
 *
 * Optional (Dialog related)
 *  jquery.ui.button.js
 *	jquery.ui.resizable.js
 *	jquery.ui.draggable.js
 */

(function( $, undefined ) {

function MultiDialog(){
	this.defaults = {
		// config for gallery mode
		gallery: {
			enabled: false,	// use all selected elements as a gallery
			loop: false,
			strings: {
				position: "Item {index} of {amount}: ",
				next: "Next",
				prev: "Previous"
			},
			showPositionInfo: {
				title: true,
				desc: false
			}
		},

		descEnabled: true, // enable description pane

		// jQuery UI Dialog options
		dialog: {
			// see jQuery UI Dialog docs for al options, some options are not available!
			closeOnEscape: true,
			closeText: "close",
			closeModalOnClick : true, // close MultiDialog by click on overlay

			// size (int), width and height set the content size, not overall size, auto not allowed
			width: 600,
			height: 400,

			// viewport settings
			forceFullscreen: false,
			resizeOnWindowResize: true,
			scrollWithViewport: true,
			resizeAccordingToViewport: true,
			resizeToBestPossibleSize: false,

			// animated options
			useAnimation: true,
			animateOptions: {
				duration: 500,
				queue: false
			},

			show: "fade", // string, use any jQuery UI effect here
			hide: "fade",
			modal: true,
			buttons: null, // options: null (default, adds pre/next buttons in gallery mode), {} (no buttons at all), or use as default dialog option

			// callbacks, please note: close, open and resize callback are not available
			resized: null,

			// do not alter these!
			useContentSize: true
		},

		disabled: false, // disable plugin
		getVarPrefix: "", // GET var prefix

		// set testing condition, description, alt and title atttribute for each content type
		types: {
			defaultType: "auto", // image, ajax, inline, iframe, youtube, vimeo
			// default rendering for all content types, overwritten by each content type config
			defaultConfig: {
				test: null, // test for this content type, returns boolean
				template: "<div class='overflow'>{content}</div>",
				// title, desc & marker will only be rendered if an element is available (given by API or click event)
				title: function( element ) { // dialog title
					return element.attr( "title" ) || element.text();
				},
				desc: null,	// description text
				marker: {},	// marker in templates, like image alt attribute
				addParameters: "" // addtional parameters (added to the given URL)
			},
			// configuration specific for each content type, merged with default config, use callbacks provided by this plugin instead
			config: {
				image: {
					test: function( href ) {
						return href.match( /\.(jpg|jpeg|png|gif)$/ );
					},
					template: "<a href='#next' class='multibox-api next' rel='next'></a><a href='#prev' class='multibox-api prev' rel='prev'></a><img width='100%' height='100%' alt='{alt}' title='{title}' src='{path}' />",
					title: function( element ) {
						return element.find( "img" ).attr( "alt" ) || element.text();
					},
					desc: function( element ) {
						return element.find( "img" ).attr( "longdesc" ) || element.find( "img" ).attr( "alt" ) || element.attr( "title" );
					},
					marker: {
						title: function( element ) {
							return element.find( "img" ).attr( "alt" ) || element.attr( "title" ) || element.text();
						},
						alt: function( element ) {
							return element.find( "img" ).attr( "alt" ) || element.find( "img" ).attr( "title" ) || element.attr( "title" ) || element.text();
						}
						// add custom attributes, index is marker in template
					}
				},
				youtube: {
					test: function( href ) {
						return href.match( /youtube\.com\/watch/i ) || href.match( /youtu\.be/i );
					},
					template: "<iframe width='100%' height='100%' src='{url}' frameborder='0' allowFullScreen></iframe>",
					addParameters: "?autoplay=1"
				},
				vimeo: {
					test: function( href ) {
						return href.match( /vimeo\.com\//i );
					},
					template: "<iframe width='100%' height='100%' src='{url}' frameborder='0' webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>",
					addParameters: "?autoplay=1"
				},
				iframe: {
					test: function( href ) {
						return href.match( /iframe=true/i );
					},
					template: "<iframe width='100%' height='100%' src='{url}' frameborder='0'></iframe>"
				},
				ajax: {
					test: function( href ) {
						return href.match( /ajax=true/i );
					},
					// $.ajax settings
					settings: {
						// Please note: be careful with error, success and href
						dataType: "html"
					}
				},
				inline: {
					test: function( href ) {
						return href.match(/\#/);
					}
					// Please note: addParameters is not possible for inline type as the page is already loaded!
				}
				// add own config here!
			}
		},

		// custom opener
		// this is a backfall, render your own HTML by type parameter! Set your own type parameter by using types.config option!
		openCustom: function( data ){
			window.open( data.href, "_newtab" );
		},

		// loading handler
		loadingHandler: function( data ){
			this.isLoading = true;
			this._defaultHandler( "<div class='ui-state-highlight ui-corner-all'><p><span class='ui-icon ui-icon-info'></span><strong>Loading content, please wait!</strong></p></div>", "Loading...", data );
		},

		// error handler
		errorHandler: function( data ){
			this._defaultHandler( "<div class='ui-state-error ui-corner-all'><p><span class='ui-icon ui-icon-alert'></span><strong>Sorry, an error has occured. Please try again!</strong></p></div>", "Error!", data.data );
		},

		// callbacks
		on: {
			create: null,
			createDialog: null,
			open: null,
			change: null,
			close: null,
			position: null,
			resize: null,
			move: null,
			// specific
			imageError: null,
			inlineError: null
			// use ajax.settings option for ajax specific callbacks
			// use loadingHandler and errorHandler as callbacks if needed
		}
	};
}

$.extend( MultiDialog.prototype, {
	_create: function( _elements, _options ) {
		// set jQuery UI similar defaults
        this.widgetName = "MultiDialog";
        this.options = $.extend( true, {}, this.defaults, _options );
		this.uid = this.widgetName + "-" + Math.random().toString( 16 ).slice( 2, 10 );
		this.isOpen = false;
		this.isLoading = false;

		var that = this,
			options = this.options,
			elements = $( _elements );

		// merge type configs with default
		$.each( options.types.config, function( type ) {
			options.types.config[ type ] = $.extend( true, {}, options.types.defaultConfig, options.types.config[ type ] );
		});

		// set click event if not disabled and not API
		if ( elements.length && !options.disabled ) {
			elements.bind( "click." + this.widgetName, function( event ){
				if ( elements.length > 1 && options.gallery.enabled ) {
					that.openGallery( elements, $( this ) );
				} else {
					that.openLink( $(this) );
				}
				// save clicked element
				that.clickedElement = event.currentTarget;
				// do not follow link
				event.preventDefault();
			});
		}

		that._fireCallback( "create" );
	},

	/*
	* Opens a link in a dialog
	* @param data {Object, Jquery Object, String} MultiDialog data object (with at least one: html, href or element), can also be an jquery object containing a <a> tag or an URL
	*/
	openLink: function( _data ) {
		var options = this.options,
			data = this._openLinkHelper( _data ),
			typeGet, config, widthGet, heightGet, fn;

		// get type
		if ( !data.type ) {
			typeGet = this._getUrlVar( data.href, options.getVarPrefix + "type" );
			if ( typeGet ) {
				data.type = ( typeGet === "auto" ) ? this._getType( data.href ) : typeGet;
			} else {
				data.type = ( options.types.defaultType === "auto" ) ? this._getType( data.href ) : options.types.defaultType;
			}
		} else if ( data.type === "auto" ) {
			data.type = this._getType( data.href );
		}

		// get title, description and marker if possible
		if ( data.element ) {
			config = ( data.type ) ? options.types.config[ data.type ] : options.types.defaultConfig;
			data.marker = $.extend( {}, config.marker, data.marker );

			$.each( config.marker, function( key, callback) {
				if ( $.isFunction( callback ) ) {
					data.marker[ key ] = callback.call( this, data.element );
				}
			});

			if ( !data.title && $.isFunction( config.title ) ) {
				data.title = config.title.call( this, data.element );
			}

			if ( options.descEnabled && !data.desc && $.isFunction( config.desc ) ) {
				data.desc = config.desc.call( this, data.element );
			}
		}

		// check size parameter
		if ( isNaN( data.width ) ) {
			widthGet = this._getUrlVar( data.href, options.getVarPrefix + "width" );
			data.width = ( widthGet ) ? parseInt( widthGet, 10 ) : false;
		}
		if ( isNaN( data.height ) ) {
			heightGet = this._getUrlVar( data.href, options.getVarPrefix + "height" );
			data.height = ( heightGet ) ? parseInt( heightGet, 10 ) : false;
		}

		// check if open function exists
		fn = "open" + data.type.charAt( 0 ).toUpperCase() + data.type.slice( 1 );
		if ( fn !== "open" && $.isFunction( this[ fn ] ) ) {
			this[ fn ]( data );
		} else {
			options.openCustom.call( this, data );
		}
	},

	// test each configured content type
	_getType: function( href ) {
		var type = "";

		$.each( this.options.types.config, function( _type, config ) {
			if ( config.test.call( this, href ) ) {
				type = _type;
				return false;
			}
		});

		return type;
	},

	/*
	* OpenXyz functions: opens its specific type, please pass in data.href
	* @param data.href (URL), data.element (<a>), jQuery object (<a>), string (URL)
	*/
	openImage: function( data ) {
		data = this._openLinkHelper( data );
		var that = this,
			options = this.options,
			image = new Image();

		// open loading message
		options.loadingHandler.call( this, data );

		// preload image
		image.onload = function(){
			if ( !data.width ) {
				data.width = image.width;
			}
			if ( !data.height ) {
				data.height = image.height;
			}
			that._parseHtml( data, "image", "path" );
			that._changeDialog( data );
			// unload onload, IE specific, prevent animated gif failures
			image.onload = function(){};
		};
		// error handling
		image.onerror = function( error ){
			options.errorHandler.call( that, that._fireCallback( "imageError", error, data ) );
		};
		// load image
		image.src = data.href + options.types.config.image.addParameters;
	},

	openIframe: function( data ) {
		data = this._openLinkHelper( data );
		this._parseHtml( data, "iframe", "url" );
		this._open( data );
	},

	openInline: function( data ) {
		data = this._openLinkHelper( data );
		var element = $("#" + data.href.split("#")[1]);
		if ( element.length ) {
			this._parseHtml( data, "inline", "content", element.html() );
			this._open( data );
		} else {
			this.options.errorHandler.call( this, this._fireCallback( "inlineError", null, data ) );
		}
	},

	openYoutube: function( data ) {
		data = this._openLinkHelper( data );
		var path = "http://www.youtube.com/embed/" + this._getUrlVar( data.href, "v" ) + this.options.types.config.youtube.addParameters;

		this._parseHtml( data, "youtube", "url", path );
		this._open( data );
	},

	openVimeo: function( data ) {
		data = this._openLinkHelper( data );
		var match = data.href.match( /http:\/\/(www\.)?vimeo.com\/(\d+)/ ),
			path = "http://player.vimeo.com/video/" + match[2] + this.options.types.config.vimeo.addParameters;

		this._parseHtml( data, "vimeo", "url", path );
		this._open( data );
	},

	openAjax: function( data ) {
		data = this._openLinkHelper( data );
		var that = this,
			options = this.options,
			ajaxOptions;

		// open loading message
		options.loadingHandler.call( this, data );

		// default ajax settings
		ajaxOptions = $.extend( {
			url: data.href,
			error: function ( info ) {
				options.errorHandler.call( that, that._fireCallback( "ajaxError", info, data ) );
			},
			success: function( html ) {
				that._parseHtml( data, "ajax", "content", html );
				that._changeDialog( data );
			}
		}, options.types.config.ajax.settings );

		// get data and show content
		this.xhr = $.ajax( ajaxOptions );
	},

	// data = html, jQuery object, data.html, data.element
	openHtml: function( data ) {
		var isJquery = data instanceof jQuery;

		if ( isJquery || data.element ) {
			if ( isJquery ) {
				data.element = data;
			}
			data.html = data.element.html();
		} else  {
			data.html = data;
		}

		this._open( data );
	},

	// checks: data.href (URL), data.element (<a>), jQuery object (<a>), string (URL)
	_openLinkHelper: function( data ) {
		if ( !data.href ) {
			if ( data.element ) {
				data.href = data.element.attr( "href" );
			} else {
				// save parameter and create data object
				var element = data;
				data = {};
				// if jQuery object containing a link
				if ( element instanceof jQuery ) {
					data.href = element.attr( "href" );
					data.element = element;
				} else {
					// seems to be a link
					data.href = element;
				}
			}
		}

		return data;
	},

	/*
	* Opens a dialog
	* @param data {Object, Jquery Object, string )} MultiDialog data object (with at least one: html, href or element), can also be an jQuery object containing a <a> tag or any other HTML element (its content will be opened) or plain HTML
	*/
	open: function( data ) {
		if ( data.href || ( data.element && data.element.is( "a" ) ) || ( data instanceof jQuery && data.is( "a" ) ) ) {
			this.openLink( data );
		} else {
			this.openHtml( data );
		}
	},

	_open: function( data ) {
		if ( !this.options.disabled ) {
			if ( this.uiDialog ) {
				this._changeDialog( data );
			} else {
				this._createDialog( data );
			}
		}
	},

	/*
	* Opens a dialog in gallery mode
	* @param group {Array, Jquery Object} An simple array with MultiDialog data objects, can also be an jquery object containing a set of elements or <a> tags
	* @param index {Jquery Object, Number} A link tag element within the group parameter or a index (starts with 0), default is the first element in group
	*/
	openGallery: function( group, index )  {
		var that = this,
			groupIsJquery = group instanceof jQuery;
		this.group = $.isArray( group ) ? group : [];

		if ( groupIsJquery ) {
			group.each( function( i ){
				that.group[ i ] = {};
				that.group[ i ].element = $( this );
			});
		}

		if ( index instanceof jQuery && groupIsJquery ) {
			this.index = group.index( index );
		} else if ( !isNaN( index ) ) {
			this.index = index;
		} else {
			this.index = 0;
		}

		if ( this.group.length > 1 ) {
			if ( !this.options.dialog.buttons ) {
				this._addGalleryButtons();
			}
			this.open( this.group[ this.index ] );
			this._addKeyboardControl();
		}
	},

	index: function( index ) {
		this._move( index );
	},

	next: function(){
		this._move( "next" );
	},

	prev: function(){
		this._move( "prev" );
	},

	first: function(){
		this._move( "first" );
	},

	last: function(){
		this._move( "last" );
	},

	_move: function( direction ) {
		var newIndex = this.index;
		switch ( direction ) {
			case "first":
				newIndex = 0;
				break;
			case "last":
				newIndex = this.group.length - 1;
				break;
			case "next":
				newIndex = ( this.options.gallery.loop && newIndex === this.group.length - 1 ) ? 0 : newIndex + 1;
				break;
			case "prev":
				newIndex = ( this.options.gallery.loop && newIndex === 0 ) ? this.group.length - 1 : newIndex - 1;
				break;
			default:
				newIndex = direction;
				break;
		}
		if ( !isNaN( newIndex ) && newIndex !== this.index && this.group[ newIndex ] ) {
			this.index = newIndex;
			this.open( this.group[ this.index ] );
			this._changeGalleryButtons();
			this._fireCallback( "move", direction, this.group[ this.index ] );
		} else {
			// autoclose on failure
			this.close();
		}
	},

	_createDialog: function( data ) {
		var that = this,
			// get size
			size = this._getSize( data );

		// prepare wrapper elements
		this.uiDialog = $( "<div />" );

		this.uiDialogContent = $( "<div />", {
			"class": this.widgetName + "-content ui-helper-clearfix " + data.type,
			"aria-describedby": this.uid + "-desc",
			html: data.html
		}).appendTo( this.uiDialog );

		this.uiDialogDesc = $( "<div />", {
			"class": this.widgetName + "-desc ui-helper-clearfix",
			"id": this.uid + "-desc",
			html: $( "<div class='inner'>" )
		}).appendTo( this.uiDialog );

		// create dialog
		this.uiDialog.dialog(
			$.extend( true, {}, that.options.dialog, {
				dialogClass: this.widgetName,
				close: function( event ){
					that._close( event );
				},
				width: size.width,
				height: size.height,
				open: function() {
					that.isOpen = true;
					that._fireCallback( "open", data );
				}
			})
		);
		this.uiDialogWidget = this.uiDialog.dialog( "widget" );
		this._setDesc( data );
		this._setTitle( data );

		// search for api links
		this.uiDialogWidget.on( "click." + this.widgetName, ".multibox-api[rel]", function( event ){
			that._move( $( this ).attr( "rel" ) );
			event.preventDefault();
		});

		// set ARIA busy when loading
		if ( this.isLoading ) {
			this._setAria();
		}

		that._fireCallback( "createDialog", null, data );
	},

	_setAria: function() {
		this.uiDialog.dialog( "setAriaLive", this.isLoading );
		this.uiDialogWidget.toggleClass( "loading", this.isLoading );
	},

	_setAndShowContent: function( data ) {
		var that = this;

		this.uiDialogContent.html( data.html );
		this._setTitle( data );
		this._setDesc( data );
		$.Widget.prototype._show( this.uiDialogContent, this.options.dialog.show, function(){
			that._setAria();
			that.uiDialog.dialog( "focusTabbable" );
			that._fireCallback( "change", null, data );
		});
	},

	_changeDialog: function( data ){
		var that = this;

		this.isLoading = false;
		$.Widget.prototype._hide( this.uiDialogDesc, this.options.dialog.hide );
		$.Widget.prototype._hide( this.uiDialogContent, this.options.dialog.hide, function(){
			that._setSize( data );
			that.uiDialogWidget.one( "dialogresized", function() {
				that._setAndShowContent( data );
			});
		});
	},

	_setDesc: function ( data ) {
		var string = this._getPositionInfo( "desc" ) + ( data.desc || "" );
		if ( string ) {
			this.uiDialogDesc.children( ".inner" ).html( string );
			$.Widget.prototype._show( this.uiDialogDesc, this.options.dialog.show );
		}
	},

	_setTitle: function ( data ) {
		var html = this._getPositionInfo( "title" ) + ( data.title || this.options.dialog.title );
		this.uiDialog.dialog( "option", "title", $( "<div>" + html + "</div>" ).text() );
	},

	_addGalleryButtons: function(){
		var that = this,
			prevDisabled = !!( this.index === 0 && !this.options.gallery.loop ),
			nextDisabled = !!( this.index === this.group.length - 1 && !this.options.gallery.loop );
		this.options.dialog.buttons = [{
			text: this.options.gallery.strings.prev,
			click: function() {
				that.prev();
			},
			disabled: prevDisabled,
			"class": "prev"
		}, {
			text: this.options.gallery.strings.next,
			click: function(){
				that.next();
			},
			disabled: nextDisabled,
			"class": "next"
		}];
	},

	_changeGalleryButtons: function(){
		if ( !this.options.gallery.loop && this.options.dialog.buttons ) {
			var buttonpane = this.uiDialogWidget.children( ".ui-dialog-buttonpane" ),
				prev = buttonpane.find( ".prev" ),
				next = buttonpane.find( ".next" );

			if ( this.index === 0 ) {
				this._changeButton( prev, next );
			} else {
				prev.button( "enable" );
			}

			if ( this.index === this.group.length - 1 ) {
				this._changeButton( next, prev );
			} else {
				next.button( "enable" );
			}
		}
	},

	_changeButton: function( b1, b2 ) {
		b1.removeClass( "ui-state-focus ui-state-hover ui-state-active" ).button( "disable" );
		b2.focus();
	},

	_addKeyboardControl: function(){
		var that = this,
			eventType = "keydown." + this.widgetName;
		// add keyboard control
		this.uiDialogWidget.unbind( eventType ).bind( eventType, function( e ){
			switch( e.keyCode ) {
				case $.ui.keyCode.RIGHT:
				case $.ui.keyCode.DOWN:
				case $.ui.keyCode.SPACE:
					that.next();
					e.preventDefault();
					break;
				case $.ui.keyCode.LEFT:
				case $.ui.keyCode.UP:
					that.prev();
					e.preventDefault();
					break;
				case $.ui.keyCode.END:
					that.last();
					e.preventDefault();
					break;
				case $.ui.keyCode.HOME:
					that.first();
					e.preventDefault();
					break;
			}
		});
	},

	_parseHtml: function( data, type, marker, value ) {
		// use href if no value is given
		if ( !value ) {
			value = data.href + this.options.types.config[ type ].addParameters;
		}
		var template = this.options.types.config[ type ].template.replace( new RegExp( "{" + marker + "}", "g" ), value );
		// process marker
		if ( data.marker ) {
			$.each( data.marker, function( name, _value ) {
				template = template.replace( new RegExp( "{" + name + "}", "g" ), _value );
			});
		}
		data.html = template;
	},

	destroy: function(){
		this.element.unbind( this.widgetName );
		this.uiDialog.dialog( "destroy" );
	},

	widget: function(){
		return this.uiDialogWidget;
	},

	dialog: function(){
		return this.uiDialog;
	},

	close: function( event ) {
		this.uiDialog.dialog( "close", event );
	},

	// called by dialog close callback
	_close: function( event ){
		if ( this.xhr ) {
			this.xhr.abort();
		}
		// remove dialog
		this.uiDialog.dialog( "destroy" );
		this.uiDialog = null;
		// restore original clicked element
		if ( this.clickedElement ) {
			$( this.clickedElement ).focus();
		}
		this.isOpen = false;
		this._fireCallback( "close", event );
	},

	_getSize: function( data ) {
		return {
			width: ( data.width && !isNaN( data.width ) ) ? data.width : this.options.dialog.width,
			height: ( data.height && !isNaN( data.height ) ) ? data.height : this.options.dialog.height
		};
	},

	_setSize: function( data ) {
		var size = this._getSize( data );
		this.uiDialog.dialog( "changeSize", size.width, size.height );
	},

	_defaultHandler: function( html, title, data ) {
		var that = this,
			_data = $.extend( {}, data, { html: html, title: title, desc: "" } );
		// do not resize when already open
		if ( this.isOpen ) {
			$.Widget.prototype._hide( this.uiDialogDesc, this.options.dialog.hide );
			$.Widget.prototype._hide( this.uiDialogContent, this.options.dialog.hide, function(){
				that._setAndShowContent( _data );
			});
		} else {
			this._open( _data );
		}
	},

	_getPositionInfo: function( key ) {
		if ( this.options.gallery.enabled && this.group.length > 0 && this.options.gallery.showPositionInfo[ key ] && !this.isLoading ) {
			return "<span class='position'>" + this.options.gallery.strings.position.replace( "{index}", this.index + 1 ).replace( "{amount}", this.group.length ) + "</span>";
		}

		return "";
	},

	// TODO testing
	_fireCallback: function( eventName, eventData, data ) {
		var info = {
			eventName: eventName,
			eventData: eventData,
			data: data,
			dialog: this.uiDialogWidget,
			group: this.group,
			index: this.index
		};

		if ( eventName && this.options.on[ eventName ] && $.isFunction( this.options.on[ eventName ] ) ) {
			// this.options.on[ eventName ]( this, info );
			this.options.on[ eventName ].call( this, info );
		}

		return info;
	},

	_getUrlVar: function( href, name ){
		var hashes = href.slice( href.indexOf( "?" ) + 1 ).split( "&" ),
			vars = [],
			hash, i;

		for ( i = 0; i < hashes.length; i++ ) {
			hash = hashes[ i ].split( "=" );
			vars.push( hash[ 0 ] );
			vars[ hash[ 0 ] ] = hash[ 1 ];
		}

		return vars[ name ];
	}
});

// plugin definition
$.fn.MultiDialog = function( options ) {
	// singleton instance
	$.MultiDialog = new MultiDialog();
	$.MultiDialog._create( this, options );
	return $.MultiDialog;
};

}(jQuery));