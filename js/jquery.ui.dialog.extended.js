/*!
 * jQuery UI Dialog Extended
 *
 * Copyright 2013, Felix Nagel (http://www.felixnagel.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * http://github.com/fnagel/jquery-ui-extensions
 *
 * Depends:
 *	jquery.ui.dialog.js
 */
(function( $ ) {

/*
	TODO
	Fix moveable, resizable and draggable functionality
*/

/*
 * Option width and height normally set the overall dialog dimensions.
 * This extensions make these options the dimensions of the content pane.
 * This way it's possible to set the real content dimensions.
 *
 * Please note you won't get the original size but the calculated overall size
 * when using the width and height option getter.
 */
$.widget( "ui.dialog", $.ui.dialog, {
	options: {
		height: 200, // auto is not allowed when using animation

		closeModalOnClick: true,
		
		// viewport settings
		forceFullscreen: false,
		resizeOnWindowResize: false,
		scrollWithViewport: false,
		resizeAccordingToViewport: true,
		resizeToBestPossibleSize: false,

		// width and height set the content size, not overall size
		useContentSize: false,

		// animated options
		useAnimation: true,
		animateOptions: {
			duration: 500,
			queue: false
		},

		// callbacks
		resized: null
	},

	// Changes content and resizes dialog
	change: function( content, width, height, animate ) {
		var that = this;
		
		if ( typeof animate !== "boolean" ) {
			animate = this.options.useAnimation;
		}

		if ( animate ) {
			this.setAriaLive( true );
			this.element.one( this.widgetEventPrefix + "resized", function() {
				that.element.html( content );
				that.setAriaLive( false );
			});
		} else {
			this.element.html( content );
		}

		this.changeSize( width, height );
	},
	
	// Changes size
	changeSize: function( width, height ) {
		this._setOptions({
			width: width,
			height: height
		});
	},
	
	_setOption: function( key, value ) {
		if ( key === "width" ) {			
			this._oldSize.width = value;
		}
		if ( key === "height" ) {
			this._oldSize.height = value;
		}
			
		// we need to adjust the size as we need to set the overall dialog size
		if ( this.options.useAnimation && this.options.useContentSize && this._isVisible ) {
			if ( key === "width" ) {		
				value = value + ( this.uiDialog.width() - this.element.width() );	
			}
			if ( key === "height" ) {
				value = value + ( this.uiDialog.outerHeight() - this.element.height() );
			}
		}

		this._super( key, value );		
	},

	_getSize: function( data ) {
		var options = this.options,
			feedback = $.position.getWithinInfo( options.position.of ),
			portrait = ( feedback.height >= feedback.width ) ? true : false,
			fullscreen = {
				width: feedback.width,
				height: feedback.height
			};

		if ( options.forceFullscreen ) {
			return fullscreen;
		}

		if ( options.resizeToBestPossibleSize ) {
			if ( portrait ) {
				data = this._calcSize( data, feedback.height, "height", "width" );
			} else {
				data = this._calcSize( data, feedback.height, "height", "width" );
			}
			return data;
		}

		if ( options.resizeAccordingToViewport ) {
			if ( feedback.width < data.width ) {
				data = this._calcSize( data, feedback.width, "width", "height" );
			}
			if ( feedback.height < data.height ) {
				data = this._calcSize( data, feedback.height, "height", "width" );
			}
		}

		return data;
	},

	_calcSize: function( data, value, sortBy, toSort ) {
		var newData = {};

		newData[ toSort ] = Math.max( 0, ( data[ toSort ] / data[ sortBy ] ) * value );
		newData[ sortBy ] = value;

		return newData;
	},

	_size: function() {
		// overwrite options with recalculated dimensions
		$.extend( this.options, this._getSize( this.options ) );
		
		if ( this._isVisible && this.options.useAnimation ) {
			this._animateSize();
			return;
		}

		if ( this.options.useContentSize ) {
			this._contentSize();
			return;
		}

		this._super();
	},

	/*
	 * Sets the size of the dialog
	 *
	 * Options width and height define content size, not overall size
	 */
	_contentSize: function() {
		// If the user has resized the dialog, the .ui-dialog and .ui-dialog-content
		// divs will both have width and height set, so we need to reset them
		var nonContentHeight, nonContentWidth, minContentHeight, maxContentHeight, actualSize,
			options = this.options;

		// Reset content sizing
		nonContentWidth = this.element.show().css({
			width: options.width,
			minHeight: 0,
			maxHeight: "none",
			height: 0
		}).outerWidth() - options.width;
		this.element.css( "width", "auto" );

		if ( options.minWidth > options.width + nonContentWidth ) {
			options.width = options.minWidth;
		}

		// reset wrapper sizing
		// determine the height of all the non-content elements
		nonContentHeight = this.uiDialog.css({
				height: "auto",
				width: options.width + nonContentWidth
			})
			.outerHeight();
			
		actualSize = this._getSize({
			width: options.width + nonContentWidth,
			height: options.height + nonContentHeight
		});
		
		this.uiDialog.css( "width", actualSize.width );		
		this.element.height( Math.max( 0, actualSize.height - nonContentHeight ) );
			
		if (this.uiDialog.is(":data(ui-resizable)") ) {
			this.uiDialog.resizable( "option", "minHeight", this._minHeight() );
		}
		
		// save calculated overall size
		$.extend( options, actualSize );		
	},

	// Processes the animated positioning (position using callback), works with any width and height options
	_animateUsing: function( position, data, content ) {
		var that = this;

		// calculate new position based on the viewport
		position.left = ( data.target.left + ( data.target.width - data.element.width + ( data.element.width - this.options.width ) ) / 2 );
		position.top = ( data.target.top + ( data.target.height - data.element.height + ( data.element.height - this.options.height ) ) / 2 );

		if ( position.top < 0 ) {
			position.top = 0;
		}

		this.uiDialog.animate( position, $.extend( {}, this.options.animateOptions, {
			complete: function() {
				that._trigger( "resized" );
			}
		}));
	},

	// animated the size, uses width and height options like default dialog widget (overall size)
	_animateSize: function() {
		var options = this.options;

		this.uiDialog.animate({
			width: options.width
		}, options.animateOptions );

		this.element.animate({
			// options.height is overall size, we need content size
			height: options.height - ( this.uiDialog.outerHeight() - this.element.height() )
		}, options.animateOptions );
	},

	// position overwrite for animated positioning
	_position: function() {
		var that = this,
			options = this.options,
			originalUsing = options.position.using;

		if ( !options.useAnimation || !this._isVisible ) {
			this._super();
			return;
		}

		// change position.using mechanism
		options.position.using = function( position, feedback  ) {
			that._animateUsing( position, feedback , content );
		};
		this._super();
		// reset position.using mechanism
		options.position.using = originalUsing;
	},

	// ARIA helper
	setAriaLive: function( busy ){
		this.uiDialog.attr({
			"aria-live": "assertive",
			"aria-relevant": "additions removals text",
			"aria-busy": busy
		});
	},

	// all following functions add a variable to determine if the dialog is visible
	_create: function() {
		this._super();
		this._isVisible = false;
		this._oldSize = {
			width: this.options.width,
			height: this.options.height
		};

		// make dialog responsive to viewport changes
		this._on( window, this._windowResizeEvents );
	},

	_windowResizeEvents: {
		resize: function( event ){
			if ( this.options.resizeOnWindowResize ) {
				this._addTimeout( function() {
					this._setOptions( this._oldSize );
				});
			}
		},
		scroll: function( event ){
			// second test prevents initial page load scroll event
			if ( this.options.scrollWithViewport && this.timeout ) {
				this._addTimeout( function() {
					this._position();
				});
			}
		}
	},
	
	_addTimeout: function( callback ) {
		clearTimeout( this.timeout );
		if ( this._isVisible ) {
			this.timeout = this._delay( callback, 250 );
		}	
	},

	open: function() {
		this._super();
		this._isVisible = true;
	},

	close: function() {
		this._super();
		this._isVisible = false;
	},
	
	_createOverlay: function(){
		this._super();
		if ( this.options.modal && this.options.closeModalOnClick ) {		
			this._on( this.overlay, {
				mousedown: function( event ){
					this.close( event );
				}
			});
		}
	}
});

}( jQuery ));
