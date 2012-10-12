/*!
 * jQuery MultiDialog Beta (12. Oct 2012)
 *
 * Copyright 2012, Felix Nagel, http://www.felixnagel.com
 * Licensed under the GPL Version 3 license.
 *
 * http://github.com/fnagel/
*/
/*
 * Depends:
 *  jquery.js
 *	jquery.ui.core.js
 *	jquery.ui.widget.js
 *	jquery.ui.position.js
 *	jquery.ui.dialog.js
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
		// general MultiDialog options
		disabled: false, // boolean
		disabledFunc: function(){ // returns boolean, addtional function to disable widget
			return ( $( window ).width() < 400 ) || ( $( window ).height() < 300 ); // disabled on small screens
		},
		getVarPrefix: "", // GET var prefix
		closeOnClickOverlay: true, // close MultiDialog by click on overlay
		animationSpeed: 500, // speed of all hide and fade animations
		em: 0.0757575, // multiplicator for em calculation (resize with text), set to false to disable
		margin: 26,	// int, margin of the content wrapping divs (jQuery UI CSS: ui-lightness=38, ...)
		forceFullscreen: false,

		// config for gallery mode
		gallery: {
			enabled: false,	// use all selected elements as a gallery
			loop: false,
			strings: {
				position: "Item {index} of {amount} ",
				next: "Next",
				prev: "Previous"
			}
		},

		// configuration for description
		desc: {
			enabled: true,
			height: "auto",	// int or "auto", sets height of the description pane
			template: function( data ) {
				var html = '';
				if ( this.options.desc.enabled ) {
					if ( this.options.gallery.enabled && this.group.length > 0 && !this.isLoading ) {
						html = '<span class="positon">' + this.options.gallery.strings.position.replace( '{index}', this.index + 1 ).replace( '{amount}', this.group.length ) + '</span>';
					}
					if ( data.desc )  html += data.desc;
				}
				return html;
			}
		},

		// jQuery UI Dialog options
		dialog: { // see jQuery UI Dialog options, removed options are not available!
			closeOnEscape: true,
			closeText: 'close',
			title: '',
			// size
			width: 600, // int, "auto" is not possible, please note this is content width, not widget width like native Dialog behaviour
			height: 400, // see above
			// position and effects
			modal: true,
			// TODO Dialog options should be possible
			// check if options set, if so use show(options.dialog.show) and try to add events to animated element; otherwise use show()
			show: "fade", // string, use any jQuery UI effect here
			hide: "fade", // see above
			// visual level
			stack: false,
			zIndex: 1000,
			position: {
				of: window,
				my: 'center',
				at: 'center',
				collision: 'fit'
			},
			draggable: false, // you need to include jQuery UI draggable
			// resizable
			resizable: false, // you need to include jQuery UI resizable
			maxHeight: false,
			maxWidth: false,
			minHeight: 150,
			minWidth: 150,
			// buttonpane
			buttons: {}	// overwritten if gallery mode is enabled
			// please note: close, open and resize callback are not available
		},

		// set testing condition, description, alt and title atttribute for each content type
		types: {
			defaultType: "auto", // image, ajax, inline, iframe, youtube, vimeo
			// default rendering for all content types, overwritten by each content type config
			defaultConfig: {
				test: null, // test for this content type, returns boolean
				template: '<div class="overflow">{content}</div>',
				// title, desc & marker will only be rendered if an element is available (given by API or click event)
				title: function( element ) { // dialog title
					return element.attr( "title" ) || element.text();
				},
				desc: null,	// description text
				marker: {},	// marker in templates, like image alt attribute
				addParameters: '' // addtional parameters (added to the given URL)
			},
			// configuration specific for each content type, merged with default config, use callbacks provided by this plugin instead
			config: {
				image: {
					test: function( href ) {
						return href.match( /\.(jpg|jpeg|png|gif)$/ );
					},
					template: '<a href="#multibox-next" class="multibox-api" rel="next"><img width="100%" height="100%" alt="{alt}" title="{title}" src="{path}" /></a>',
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
					template: '<iframe width="100%" height="100%" src="{url}" frameborder="0" allowFullScreen></iframe>',
					addParameters: '?autoplay=1'
				},
				vimeo: {
					test: function( href ) {
						return href.match( /vimeo\.com\//i );
					},
					template: '<iframe width="100%" height="100%" src="{url}" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>',
					addParameters: '?autoplay=1'
				},
				iframe: {
					test: function( href ) {
						return href.match( /iframe=true/i );
					},
					template: '<iframe width="100%" height="100%" src="{url}" frameborder="0"></iframe>'
				},
				ajax: {
					test: function( href ) {
						return href.match( /ajax=true/i );
					},
					// $.ajax settings
					ajaxSettings: {
						// Please note: be careful with error, success and href
						dataType: "html",
						global: false
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
			window.open( data.href, '_newtab' );
		},

		// loading handler
		loadingHandler: function( data ){
			this.isLoading = true;
			this._defaultHandler( '<div class="ui-state-highlight ui-corner-all"><p><span class="ui-icon ui-icon-info"></span><strong>Loading content, please wait!</strong></p></div>', "Loading...", data );
		},

		// error handler
		errorHandler: function( data ){
			this._defaultHandler( '<div class="ui-state-error ui-corner-all"><p><span class="ui-icon ui-icon-alert"></span><strong>Sorry, an error has occured. Please try again!</strong></p></div>', "Error!", data.data );
		},

		// callbacks
		on: {
			ceate: null,
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
			// use ajaxSettings option for ajax specific callbacks
			// use loadingHandler and errorHandler as callbacks if needed
		}
	};
}

$.extend( MultiDialog.prototype, {
	_create: function( elements, options ) {
		// set jQuery UI similar defaults
        this.widgetName = "MultiDialog";
        this.options = $.extend( true, {}, this.defaults, options );
		this.uid = this.widgetName + "-" + Math.random().toString( 16 ).slice( 2, 10 );
		this.isOpen = false;

		var that = this,
			options = this.options,
			elements = $( elements );

		// merge type configs with default
		$.each( options.types.config, function( type ) {
			options.types.config[ type ] = $.extend( true, {}, options.types.defaultConfig, options.types.config[ type ] );
		});

		// set click event if not disabled and not API
		if ( elements.length && !( options.disabled || options.disabledFunc.call( this ) ) ) {
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
	openLink: function( data ) {
		var options = this.options;
		// prepare needed data
		if ( data.href || data.element ) {
			if ( data.element instanceof jQuery && !data.href ) {
				data.href = data.element.attr( "href" );
			}
		} else {
			// save parameter and create data object
			var element = data,
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

		// get type
		if ( !data.type ) {
			var typeGet = this._getUrlVar( data.href, options.getVarPrefix + "type" );
			if ( typeGet ) {
				data.type = ( typeGet == "auto" ) ? this._getType( data.href ) : typeGet;
			} else {
				data.type = ( options.types.defaultType == "auto" ) ? this._getType( data.href ) : options.types.defaultType;
			}
		} else if ( data.type == "auto" ) {
			data.type = this._getType( data.href );
		}

		// get title, description and marker if possible
		if ( data.element ) {
			var config = ( data.type ) ? options.types.config[ data.type ] : options.types.defaultConfig;
			data.marker = $.extend( {}, config.marker, data.marker );

			$.each( config.marker, function( key, callback) {
				if ( $.isFunction( callback ) ) {
					data.marker[ key ] = callback.call( this, data.element );
				}
			});

			if ( !data.title && $.isFunction( config.title ) ) {
				data.title = config.title.call( this, data.element );
			}

			if ( options.desc.enabled && !data.desc && $.isFunction( config.desc ) ) {
				data.desc = config.desc.call( this, data.element );
			}
		}

		// check width and type parameter
		if ( isNaN( data.width ) ) {
			var widthGet = this._getUrlVar( data.href, options.getVarPrefix + "width" );
			data.width = ( widthGet ) ? parseInt( widthGet ) : false;
		}
		if ( isNaN( data.height ) ) {
			var heightGet = this._getUrlVar( data.href, options.getVarPrefix + "height" );
			data.height = ( heightGet ) ? parseInt( heightGet ) : false;
		}

		// check if open function exists
		var fn = "open" + data.type.charAt( 0 ).toUpperCase() + data.type.slice( 1 );
		if ( fn != "open" && $.isFunction( this[ fn ] ) ) {
			this[ fn ]( data );
		} else {
			options.openCustom.call( this, data );
		}
	},

	// test each configured content type
	_getType: function( href ) {
		var type = '';

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
	* @param data {Object} An MultiDialog object, needs at least data.href (target link)
	*/
	openImage: function( data ) {
		var that = this,
			options = this.options,
			image = new Image();

		// open loading message
		that.options.loadingHandler.call( this, data );

		// preload image
		image.onload = function(){
			if ( !data.width ) data.width = image.width;
			if ( !data.height ) data.height = image.height;
			that._parseHtml( data, "image", "path" );
			that._changeDialog( data );
			// unload onload, IE specific, prevent animated gif failures
			image.onload = function(){};
		};
		// error handling
		image.onerror = function( error ){
			that.options.errorHandler.call( that, that._fireCallback( "imageError", error, data ) );
		};
		// load image
		image.src = data.href + this.options.types.config.image.addParameters;
	},

	openIframe: function( data ) {
		this._parseHtml( data, "iframe", "url" );
		this._open( data );
	},

	openInline: function( data ) {
		var element = $("#" + data.href.split("#")[1]);
		if ( element.length ) {
			this._parseHtml( data, "inline", "content", element.html() );
			this._open( data );
		} else {
			this.options.errorHandler.call( this, this._fireCallback( "inlineError", null, data ) );
		}
	},

	openYoutube: function( data ) {
		var path = "http://www.youtube.com/embed/" + this._getUrlVar( data.href, "v" ) + this.options.types.config.youtube.addParameters;

		this._parseHtml( data, "youtube", "url", path );
		this._open( data );
	},

	openVimeo: function( data ) {
		var match = data.href.match( /http:\/\/(www\.)?vimeo.com\/(\d+)/ ),
			path = 'http://player.vimeo.com/video/'+ match[2] + this.options.types.config.vimeo.addParameters;

		this._parseHtml( data, "vimeo", "url", path );
		this._open( data );
	},

	openAjax: function( data ) {
		var that = this,
			options = this.options;

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
		}, options.types.config.ajax.ajaxSettings );

		// get data and show content
		this.xhr = $.ajax( ajaxOptions );
	},

	openHtml: function( data ) {
		this._open( data );
	},

	/*
	* Opens a dialog
	* @param data {Object, Jquery Object, String} MultiDialog data object (with at least one: html, href or element), can also be an jQuery object containing a <a> tag or any other HTML element (its content will be opened) or an URL
	*/
	open: function( data ) {
		if ( data instanceof jQuery ) {
			if ( data.is( "a" ) ) {
				this.openLink( data );
			} else {
				this._open( { html: data.html() } );
			}
		} else {
			if ( data.html ) {
				this._open( data );
			} else if ( data.href ) {
				this.openLink( data );
			} else if ( data.element && data.element instanceof jQuery ) {
				if ( data.element.is( "a" ) ) {
					this.openLink( data );
				} else {
					data.html = data.element.html();
					this._open( data );
				}
			} else {
				// seems to be a url
				this.openLink( { href: data } );
			}
		}
	},

	_open: function( data ) {
		if ( !this.options.disabled ) {
			if ( this.uiDialog ) {
				if ( this.isOpen ) {
					this._changeDialog( data );
				} else {
					this._openDialog( data );
				}
			} else {
				this._createDialog( data );
			}
		}
	},

	/*
	* Opens a dialog in gallery mode
	* @param group {Array, Jquery Object} An simple array with MultiDialog data objects, can also be an jquery object containing a set of <a> tags
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
			this._addGalleryButtons();
			// caching, this builds a reference between this.group the data object changed later on
			// .html will be saved (after loading image, ajax, etc) and not rendered again
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
			case 'first':
				newIndex = 0;
				break;
			case 'last':
				newIndex = this.group.length - 1;
				break;
			case 'next':
				newIndex = ( this.options.gallery.loop && newIndex == this.group.length - 1 ) ? 0 : newIndex + 1;
				break;
			case 'prev':
				newIndex = ( this.options.gallery.loop && newIndex === 0 ) ? this.group.length - 1 : newIndex - 1;
				break;
			default:
				newIndex = direction;
				break;
		}
		if ( !isNaN( newIndex ) && newIndex != this.index && this.group[ newIndex ] ) {
			this.index = newIndex;
			// caching
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
			resized = false,
			// get dimensions
			dimensions = this._getDimensions( data );

		// save initial dimensions
		that._setOldDimensions( dimensions );

		// prepare wrapper elements
		this.uiDialogContent = $( "<div />", {
			'class': this.widgetName + "-content ui-helper-clearfix " + data.type,
			"aria-describedby": this.uid + "-desc",
			height: dimensions.contentHeight,
			html: data.html
		});

		this.uiDialogDesc = $( '<div />', {
			"class": this.widgetName + '-desc ui-helper-clearfix',
			"id": this.uid + "-desc"
		});
		this._setDesc( data );

		this.uiDialogSize = $( "<div />", {
			'class': this.widgetName + "-size",
			height: this._getMeasure( dimensions.height ),
			html: this.uiDialogContent
		});

		// create dialog
		this.uiDialog = $( "<div />", {
			html: this.uiDialogSize.append(this.uiDialogDesc)
		}).dialog(
			$.extend( true, {}, that.options.dialog, {
				dialogClass: this.widgetName,
				title: data.title,
				width: dimensions.width + this.options.margin,
				height: "auto",
				close: function( event ){
					that._close( event );
				},
				open: function() {
					that.isOpen = true;
					that._fireCallback( "open", data );
				},
				resize: function(){
					// make resizable content possible
					if ( !resized ) {
						that.uiDialogSize.css( "height", "100%" );
						resized = true;
					}
				}
			})
		);

		// save widget and set width to auto
		this.uiDialogWidget = this.uiDialog.dialog( "widget" );

		// set ARIA busy when loading
		if ( this.isLoading ) this._contentAria();

		// make dialog responsive
		// TODO make this use _delay once 1.8.x is not in use anymore, http://jqueryui.com/upgrade-guide/1.9/#added-_delay-method
		$( window ).bind( "resize." + this.widgetName, function( event ){
			if ( that.isOpen ) {
				window.clearTimeout( that.timeout );
				that.timeout = window.setTimeout( function() {
					dimensions = that._getDimensions( { width: that.oldWidth, height: that.oldHeight, desc: that.uiDialogDesc.html() } );
					that.uiDialogSize.css("height",  that._getMeasure( dimensions.height ) );
					that.uiDialogWidget
						.css("width", that._getMeasure( dimensions.width + that.options.margin ) )
						.position( that.options.dialog.position );
					$.ui.dialog.overlay.resize();
				}, 250 );
			}
		});

		// overlay click closes multibox
		if ( that.options.closeOnClickOverlay ) {
			// TODO search for a better solution
			$("body > .ui-widget-overlay").live( "click." + this.widgetName, function( event ){
				that.close( event );
			});
		}

		that._fireCallback( "createDialog", null, data );
	},

	_openDialog: function( data ) {
		var dimensions = this._getDimensions( data );

		this.uiDialogSize.css({
			height: this._getMeasure( dimensions.height )
		});
		this._setContent( data, dimensions );
		this._setOldDimensions( dimensions );
		this.uiDialog.dialog( "open" );
		this._contentAria();
	},

	_setContent: function( data, dimensions ) {
		var that = this;

		this.uiDialogContent
			.css( "height", dimensions.contentHeight )
			.html( data.html );

		this.uiDialogContent.find(".multibox-api[rel]").bind( "click." + this.widgetName, function( event ){
			that._move( $( this ).attr( "rel" ) );
			return false;
		});

		this.uiDialog.dialog( "option", "title", data.title || this.options.dialog.title );
		this._setDesc( data );
	},

	_setAndShowContent: function( data, dimensions ) {
		var that = this;

		this._setContent( data, dimensions );
		this.uiDialogContent.show( this.options.dialog.show, this.options.animationSpeed, function(){
			that._contentAria();
			that._fireCallback( "change", null, data );
		});
	},

	_contentAria: function(){
		this.uiDialogWidget.attr({
			"aria-live": "assertive",
			"aria-relevant": "additions removals text",
			"aria-busy": this.isLoading
		});
	},

	_changeDialog: function( data ){
		// reset loading state
		this.isLoading = false;
		var dimensions = this._getDimensions( data ),
			that = this;

		this.uiDialogDesc.hide( this.options.dialog.hide, this.options.animationSpeed );
		this.uiDialogContent.hide( this.options.dialog.hide, this.options.animationSpeed, function(){
			// only change dimension and position if dimensions have changed
			if ( that.oldWidth != dimensions.width || that.oldHeight != dimensions.height ) {
				that.position( dimensions.width, dimensions.height );
				that.resize( dimensions.width, dimensions.height, function(){
					that._setAndShowContent( data, dimensions );
					that._setOldDimensions( dimensions );
				});
			} else {
				that._setAndShowContent( data, dimensions );
			}
		});
	},

	position: function( width, height, position, callback ) {
		var	that = this,
			additions = this.uiDialogWidget.children( ".ui-dialog-titlebar").outerHeight() - this.uiDialogWidget.children( ".ui-dialog-buttonpane").outerHeight();

		this.uiDialog.position(	$.extend( {}, that.options.dialog.position, {
			using: function( pos ) {
				that.uiDialogWidget.animate({
					left: "+=" + ( pos.left + ( that.uiDialogWidget.width() - that.options.margin - width ) / 2 ),
					top: "+=" + ( pos.top + ( that.uiDialogSize.height() - height + additions ) / 2 )
				}, {
					duration: that.options.animationSpeed,
					complete: function(){
						if ( $.isFunction( callback ) ) callback.call();
						that._fireCallback( "position" );
					},
					queue: false
				});
			}
		}, position ));
	},

	resize: function( width, height, callback ){
		var that = this;

		this.uiDialogSize.animate({
			height: this._getMeasure( height )
		}, {
			duration: this.options.animationSpeed,
			queue: false,
			complete: function(){
				$.ui.dialog.overlay.resize();
				if ( $.isFunction( callback ) ) callback.call();
				that._fireCallback( "resize" );
			}
		});
		this.uiDialogWidget.animate({
			width: this._getMeasure( width + that.options.margin )
		}, {
			duration: this.options.animationSpeed,
			queue: false
		});
	},

	_setDesc: function ( data ) {
		var desc = this.options.desc.template.call( this, data );
		if ( desc ) {
			this.uiDialogDesc.html( desc ).show( this.options.dialog.show, this.options.animationSpeed );
		} else {
			this.uiDialogDesc.hide();
		}
	},

	_addGalleryButtons: function(){
		var that = this,
			prevDisabled = !!( this.index === 0 && !this.options.gallery.loop ),
			nextDisabled = !!( this.index == this.group.length - 1 && !this.options.gallery.loop );
		this.options.dialog.buttons = [{
			text: this.options.gallery.strings.prev,
			click: function( event ) {
				that.prev();
			},
			disabled: prevDisabled,
			'class': "prev"
		}, {
			text: this.options.gallery.strings.next,
			click: function(){
				that.next();
			},
			disabled: nextDisabled,
			'class': "next"
		}];
	},

	_changeGalleryButtons: function(){
		if ( !this.options.gallery.loop ) {
			var buttonpane = this.uiDialogWidget.children( ".ui-dialog-buttonpane" ),
				prev = buttonpane.find( ".prev" ),
				next = buttonpane.find( ".next" );

			if ( this.index === 0 ) {
				this._changeButton( prev, next );
			} else {
				prev.button( "enable" );
			}

			if ( this.index == this.group.length - 1 ) {
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
		var that = this;
		// add keyboard control
		this.uiDialogWidget.bind( "keydown." + this.widgetName, function( event ){
			switch( event.keyCode ) {
				case $.ui.keyCode.RIGHT:
				case $.ui.keyCode.DOWN:
				case $.ui.keyCode.SPACE:
					that.next();
					break;
				case $.ui.keyCode.LEFT:
				case $.ui.keyCode.UP:
					that.prev();
					break;
				case $.ui.keyCode.END:
					that.last();
					event.preventDefault();
					break;
				case $.ui.keyCode.HOME:
					that.first();
					event.preventDefault();
					break;
			}
		});
	},

	_parseHtml: function( data, type, marker, value ) {
		// use href if no value is given
		if ( !value ) value = data.href + this.options.types.config[ type ].addParameters;
		var template = this.options.types.config[ type ].template.replace( new RegExp( '{' + marker + '}', 'g' ), value );
		// process marker
		if ( data.marker ) {
			$.each( data.marker, function( name, _value ) {
				template = template.replace( new RegExp( '{' + name + '}', 'g' ), _value );
			});
		}
		data.html = template;
	},

	destroy: function(){
		this.element.unbind( this.widgetName );
		$("body > .ui-widget-overlay").unbind( this.widgetName );
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

	// called by dialogs close callback
	_close: function( event ){
		if ( this.xhr ) {
			this.xhr.abort();
		}
		// remove content
		this.uiDialogContent.empty();
		this.uiDialogDesc.empty();
		// restore original clicked element
		if ( this.clickedElement ) {
			$( this.clickedElement ).focus();
		}
		this.isOpen = false;
		this._fireCallback( "close", event );
	},

	_getDescHeight: function( html, width ) {
		var clone = $( '<div />', {
			'class': 'ui-dialog ui-widget ui-widget-content ' + this.widgetName,
			html: '<div class="ui-dialog-content ui-widget-content"><div class="' + this.widgetName + '-size" style="width: ' + width + 'px;"><div class="' + this.widgetName + '-desc ui-helper-clearfix">' + html + '</div></div></div>',
			position: 'absolute',
			left: -10000
		}).appendTo( 'body' );

		var height = clone.find( '.' + this.widgetName + '-desc' ).outerHeight( true );
		clone.remove();

		return height;
	},

	// needs to be ratio aware
	_getDimensions: function( data ) {
		var options = this.options,
			// set dimensions for dialog widget as int
			width = ( data.width && !isNaN( data.width ) ) ? data.width : options.dialog.width,
			height = ( data.height && !isNaN( data.height ) ) ? data.height : options.dialog.height,
			contentHeight = "100%",
			desc = options.desc.template.call( this, data ),
			descHeight = 0,
			screenWidth = $( window ).width(),
			screenHeight,
			temp;

		// add desc height
		if ( desc )  {
			descHeight = ( options.desc.height == "auto" ) ? this._getDescHeight( desc, width ) : options.desc.height;
			height += descHeight;
		}

		// check for viewport and adjust size with ratio in mind if screen is to small or fullscreen mode is enabled
		if ( screenWidth < width + options.margin || options.forceFullscreen ) {
			temp = ( screenWidth - options.margin ) * 0.95;
			height = ( height / width ) * temp;
			width = temp;
			screenHeight = $( window ).height();
			if ( screenHeight < ( height + descHeight ) * 1.1) {
				temp = ( screenHeight - descHeight ) * 0.9;
				width = ( width / height ) * temp;
				height = temp;
			}
		}

		// set content height in percent
		if ( desc ) {
			contentHeight = ( 100 / height ) * ( height - descHeight ) + "%";
		}

		return { width: width, height: height, contentHeight: contentHeight };
	},

	_setOldDimensions: function( dimensions ) {
		// save width and height
		this.oldWidth = dimensions.width;
		this.oldHeight = dimensions.height;
	},

	_getMeasure: function( value ) {
		return ( this.options.em ) ? value * this.options.em + "em" : value + "px";
	},

	_defaultHandler: function( html, title, data ) {
		var that = this,
			_data = $.extend( {}, data, { html: html, title: title, desc: false } );

		// do not resize when already open
		if ( this.isOpen ) {
			this.uiDialogContent.hide( this.options.dialog.hide, this.options.animationSpeed, function(){
				that._setAndShowContent( _data, that._getDimensions( _data ) );
			});
		} else {
			that._open( _data );
		}
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
		var vars = [],
			hash,
			hashes = href.slice( href.indexOf( '?' ) + 1 ).split( '&' ),
			get = false;

		for ( var i = 0; i < hashes.length; i++ ) {
			hash = hashes[ i ].split( '=' );
			vars.push( hash[ 0 ] );
			vars[ hash[ 0 ] ] = hash[ 1 ];
		}
		get = vars[ name ];

		return get;
	}
});

// plugin definition
// TODO make this a non DOM tied jQuery UI Widget (works only in UI 1.9), http://jqueryui.com/upgrade-guide/1.9/#allow-non-dom-based-widgets
$.fn.MultiDialog = function( options ) {
	// singleton instance
	$.MultiDialog = new MultiDialog();
	$.MultiDialog._create( this, options );
	return $.MultiDialog;
};

}(jQuery));
