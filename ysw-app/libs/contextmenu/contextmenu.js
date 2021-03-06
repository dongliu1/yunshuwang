/*
 *contextMenu.js v 1.4.1
 *Author: Sudhanshu Yadav
 *s-yadav.github.com
 *Copyright (c) 2013-2015 Sudhanshu Yadav.
 *Dual licensed under the MIT and GPL licenses
 */
;
(function($, window, document, undefined) {
    "use strict";

    $.single = (function() {
        var single = $({});
        return function(elm) {
            single[0] = elm;
            return single;
        };
    }());

    $.fn.contextMenu = function(method, selector, option) {

        //parameter fix
        if (!methods[method]) {
            option = selector;
            selector = method;
            method = 'popup';
        }
        //need to check for array object
        else if (selector) {
            if (!((selector instanceof Array) || (typeof selector === 'string') || (selector.nodeType) || (selector.jquery))) {
                option = selector;
                selector = null;
            }
        }

        if ((selector instanceof Array) && (method != 'update')) {
            method = 'menu';
        }

        var myoptions = option;
        if ($.inArray(method, ['menu', 'popup', 'close', 'destroy']) > -1) {
            option = iMethods.optionOtimizer(method, option);
            this.each(function() {
                var $this = $(this)
                myoptions = $.extend({}, $.fn.contextMenu.defaults, option);
                if (!myoptions.baseTrigger) {
                    myoptions.baseTrigger = $this;
                }
                methods[method].call($this, selector, myoptions)
            });
        } else {
            methods[method].call(this, selector, myoptions)
        }
        return this;
    };
    $.fn.contextMenu.defaults = {
        triggerOn: 'click', //avaliable options are all event related mouse plus enter option
        subMenuTriggerOn: 'hover click',
        displayAround: 'cursor', // cursor or trigger
        mouseClick: 'left',
        verAdjust: 0,
        horAdjust: 0,
        top: 'auto',
        left: 'auto',
        closeOther: true, //to close other already opened context menu
        containment: window,
        winEventClose: true,
        position: 'auto', //allowed values are top, left, bottom and right
        closeOnClick: true, //close context menu on click/ trigger of any item in menu

        //callback
        onOpen: function(data, event) {},
        afterOpen: function(data, event) {},
        onClose: function(data, event) {}
    };

    var methods = {
        menu: function(selector, option) {
            selector = iMethods.createMenuList(this, selector, option);
            iMethods.contextMenuBind.call(this, selector, option, 'menu');
        },
        popup: function(selector, option) {
            $(selector).addClass('iw-contextMenu');
            iMethods.contextMenuBind.call(this, selector, option, 'popup');
        },
        update: function(selector, option) {
            var self = this;
            option = option || {};

            this.each(function() {
                var trgr = $(this),
                    menuData = trgr.data('iw-menuData');
                //refresh if any new element is added
                if (!menuData) {
                    self.contextMenu('refresh');
                    menuData = trgr.data('iw-menuData');
                }

                var menu = menuData.menu;
                if (typeof selector === 'object') {

                    for (var i = 0; i < selector.length; i++) {
                        var name = selector[i].name,
                            disable = selector[i].disable,
                            fun = selector[i].fun,
                            img = selector[i].img,
                            title = selector[i].title,
                            className = selector[i].className,
                            elm = menu.children('li').filter(function() {
                                return $(this).contents().filter(function() {
                                    return this.nodeType == 3;
                                }).text() == name;
                            }),
                            subMenu = selector[i].subMenu;

                        //toggle disable if provided on update method
                        disable != undefined && (disable ? elm.addClass('iw-mDisable') : elm.removeClass('iw-mDisable'));

                        //bind new function if provided
                        fun && elm.unbind('click.contextMenu').bind('click.contextMenu', fun);

                        //update title
                        title != undefined && elm.attr('title', title);

                        //update class name
                        className != undefined && elm.attr('class', className);

                        //update image
                        if (img) {
                            var imgIcon = elm.find('.iw-mIcon');
                            if (imgIcon.length) {
                                imgIcon[0].src = img;
                            } else {
                                elm.prepend('<img src="' + img + '" align="absmiddle" class="iw-mIcon" />');
                            }
                        }

                        //to change submenus
                        if (subMenu) {
                            elm.contextMenu('update', subMenu);
                        }
                    }

                }

                iMethods.onOff(menu);

                //bind event again if trigger option has changed.
                var triggerOn = option.triggerOn;
                if (triggerOn) {
                    trgr.unbind('.contextMenu');

                    //add contextMenu identifier on all events
                    triggerOn = triggerOn.split(" ");
                    var events = [];
                    for (var i = 0, ln = triggerOn.length; i < ln; i++) {
                        events.push(triggerOn[i] + '.contextMenu')
                    }

                    //to bind event
                    trgr.bind(events.join(' '), iMethods.eventHandler);
                }

                //set menu data back to trigger element
                menuData.option = $.extend({}, menuData.option, option);
                trgr.data('iw-menuData', menuData);
            });
        },
        refresh: function() {
            var menuData = this.filter(function() {
                return !!$(this).data('iw-menuData');
            }).data('iw-menuData'),
                newElm = this.filter(function() {
                    return !$(this).data('iw-menuData');
                });
            //to change basetrigger on refresh  
            menuData.option.baseTrigger = this;
            iMethods.contextMenuBind.call(newElm, menuData.menuSelector, menuData.option);
        },
        open: function(sel, data) {
            data = data || {};
            var e = data.event || $.Event('click');
            if (data.top) e.clientY = data.top;
            if (data.left) e.clientX = data.left;
            this.each(function() {
                iMethods.eventHandler.call(this, e);
            });
        },
        //to force context menu to close
        close: function() {
            var menuData = this.data('iw-menuData');
            if (menuData) {
                iMethods.closeContextMenu(menuData.option, this, menuData.menu, null);
            }
        },
        //to get value of a key
        value: function(key) {
            var menuData = this.data('iw-menuData');
            if (menuData[key]) {
                return menuData[key];
            } else if (menuData.option) {
                return menuData.option[key];
            }
            return null;
        },
        destroy: function() {
            var trgr = this,
                menuId = trgr.data('iw-menuData').menuId,
                menu = $('.iw-contextMenu[menuId=' + menuId + ']'),
                menuData = menu.data('iw-menuData');

            //Handle the situation of dynamically added element.
            if (!menuData) return;


            if (menuData.noTrigger == 1) {
                if (menu.hasClass('iw-created')) {
                    menu.remove();
                } else {
                    menu.removeClass('iw-contextMenu ' + menuId)
                        .removeAttr('menuId').removeData('iw-menuData');
                    //to destroy submenus
                    menu.find('li.iw-mTrigger').contextMenu('destroy');
                }
            } else {
                menuData.noTrigger--;
                menu.data('iw-menuData', menuData);
            }
            trgr.unbind('.contextMenu').removeClass('iw-mTrigger').removeData('iw-menuData');
        }
    };
    var iMethods = {
        contextMenuBind: function(selector, option, method) {
            var trigger = this,
                menu = $(selector),
                menuData = menu.data('iw-menuData');

            //fallback
            if (menu.length == 0) {
                menu = trigger.find(selector);
                if (menu.length == 0) {
                    return;
                }
            }

            if (method == 'menu') {
                iMethods.menuHover(menu);
            }
            //get base trigger
            var baseTrigger = option.baseTrigger;


            if (!menuData) {
                var menuId;
                if (!baseTrigger.data('iw-menuData')) {
                    menuId = Math.ceil(Math.random() * 100000);
                    baseTrigger.data('iw-menuData', {
                        'menuId': menuId
                    });
                } else {
                    menuId = baseTrigger.data('iw-menuData').menuId;
                }
                //create clone menu to calculate exact height and width.
                var cloneMenu = menu.clone();
                cloneMenu.appendTo('body');

                menuData = {
                    'menuId': menuId,
                    'menuWidth': cloneMenu.outerWidth(true),
                    'menuHeight': cloneMenu.outerHeight(true),
                    'noTrigger': 1,
                    'trigger': trigger
                };


                //to set data on selector
                menu.data('iw-menuData', menuData).attr('menuId', menuId);
                //remove clone menu
                cloneMenu.remove();
            } else {
                menuData.noTrigger++;
                menu.data('iw-menuData', menuData);
            }

            //to set data on trigger
            trigger.addClass('iw-mTrigger').data('iw-menuData', {
                'menuId': menuData.menuId,
                'option': option,
                'menu': menu,
                'menuSelector': selector,
                'method': method
            });

            //hover fix
            var triggerOn = option.triggerOn;
            if (triggerOn.indexOf('hover') != -1) {
                triggerOn = triggerOn.replace('hover', 'mouseenter');
                //hover out if display is of context menu is on hover
                if (baseTrigger.index(trigger) != -1) {
                    baseTrigger.add(menu).bind('mouseleave.contextMenu', function(e) {
                        if ($(e.relatedTarget).closest('.iw-contextMenu').length == 0) {
                            $('.iw-contextMenu[menuId="' + menuData.menuId + '"]').fadeOut(100);
                        }
                    });
                }

            }

            trigger.delegate('input,a,.needs-click', 'click', function(e) {
                e.stopImmediatePropagation()
            });

            //add contextMenu identifier on all events
            triggerOn = triggerOn.split(' ');
            var events = [];
            for (var i = 0, ln = triggerOn.length; i < ln; i++) {
                events.push(triggerOn[i] + '.contextMenu')
            }

            //to bind event
            trigger.bind(events.join(' '), iMethods.eventHandler);

            //to stop bubbling in menu
            menu.bind('click mouseenter', function(e) {
                e.stopPropagation();
            });

            menu.delegate('li', 'click', function(e) {
                if (option.closeOnClick && !$.single(this).hasClass('iw-has-submenu')) iMethods.closeContextMenu(option, trigger, menu, e);
            });
        },
        eventHandler: function(e) {
            e.preventDefault();
            var trigger = $(this),
                trgrData = trigger.data('iw-menuData'),
                menu = trgrData.menu,
                menuData = menu.data('iw-menuData'),
                option = trgrData.option,
                cntnmnt = option.containment,
                clbckData = {
                    trigger: trigger,
                    menu: menu
                },
                //check conditions
                cntWin = cntnmnt == window,
                btChck = option.baseTrigger.index(trigger) == -1;

            //to close previous open menu.
            if (!btChck && option.closeOther) {
                $('.iw-contextMenu').css('display', 'none');
            }

            //to reset already selected menu item
            menu.find('.iw-mSelected').removeClass('iw-mSelected');

            //call open callback
            option.onOpen.call(this, clbckData, e);


            var cObj = $(cntnmnt),
                cHeight = cObj.innerHeight(),
                cWidth = cObj.innerWidth(),
                cTop = 0,
                cLeft = 0,
                menuHeight = menuData.menuHeight,
                menuWidth = menuData.menuWidth,
                va, ha,
                left = 0,
                top = 0,
                bottomMenu,
                rightMenu,
                verAdjust = va = parseInt(option.verAdjust),
                horAdjust = ha = parseInt(option.horAdjust);

            if (!cntWin) {
                cTop = cObj.offset().top;
                cLeft = cObj.offset().left;

                //to add relative position if no position is defined on containment
                if (cObj.css('position') == 'static') {
                    cObj.css('position', 'relative');
                }

            }


            if (option.displayAround == 'cursor') {
                left = cntWin ? e.clientX : e.clientX + $(window).scrollLeft() - cLeft;
                top = cntWin ? e.clientY : e.clientY + $(window).scrollTop() - cTop;
                bottomMenu = top + menuHeight;
                rightMenu = left + menuWidth;
                //max height and width of context menu
                if (bottomMenu > cHeight) {
                    if ((top - menuHeight) < 0) {
                        if ((bottomMenu - cHeight) < (menuHeight - top)) {
                            top = cHeight - menuHeight;
                            va = -1 * va;
                        } else {
                            top = 0;
                            va = 0;
                        }
                    } else {
                        top = top - menuHeight;
                        va = -1 * va;
                    }
                }
                if (rightMenu > cWidth) {
                    if ((left - menuWidth) < 0) {
                        if ((rightMenu - cWidth) < (menuWidth - left)) {
                            left = cWidth - menuWidth;
                            ha = -1 * ha;
                        } else {
                            left = 0;
                            ha = 0;
                        }
                    } else {
                        left = left - menuWidth;
                        ha = -1 * ha;
                    }
                }
            } else if (option.displayAround == 'trigger') {
                var triggerHeight = trigger.outerHeight(true),
                    triggerWidth = trigger.outerWidth(true),
                    triggerLeft = cntWin ? trigger.offset().left - cObj.scrollLeft() : trigger.offset().left - cLeft,
                    triggerTop = cntWin ? trigger.offset().top - cObj.scrollTop() : trigger.offset().top - cTop,
                    leftShift = triggerWidth;

                left = triggerLeft + triggerWidth;
                top = triggerTop;


                bottomMenu = top + menuHeight;
                rightMenu = left + menuWidth;
                //max height and width of context menu
                if (bottomMenu > cHeight) {
                    if ((top - menuHeight) < 0) {
                        if ((bottomMenu - cHeight) < (menuHeight - top)) {
                            top = cHeight - menuHeight;
                            va = -1 * va;
                        } else {
                            top = 0;
                            va = 0;
                        }
                    } else {
                        top = top - menuHeight + triggerHeight;
                        va = -1 * va;
                    }
                }
                if (rightMenu > cWidth) {
                    if ((left - menuWidth) < 0) {
                        if ((rightMenu - cWidth) < (menuWidth - left)) {
                            left = cWidth - menuWidth;
                            ha = -1 * ha;
                            leftShift = -triggerWidth;
                        } else {
                            left = 0;
                            ha = 0;
                            leftShift = 0;
                        }
                    } else {
                        left = left - menuWidth - triggerWidth;
                        ha = -1 * ha;
                        leftShift = -triggerWidth;
                    }
                }
                //test end
                if (option.position == 'top') {
                    top = triggerTop - menuHeight;
                    va = verAdjust;
                    left = left - leftShift;
                } else if (option.position == 'left') {
                    left = triggerLeft - menuWidth;
                    ha = horAdjust;
                } else if (option.position == 'bottom') {
                    top = triggerTop + triggerHeight;
                    va = verAdjust;
                    left = left - leftShift;
                } else if (option.position == 'right') {
                    left = triggerLeft + triggerWidth;
                    ha = horAdjust;
                }
            }

            //applying css property
            var cssObj = {
                'position': (cntWin || btChck) ? 'fixed' : 'absolute',
                'display': 'inline-block',
				'z-index': 1050,
                'height': '',
                'width': ''
            };


            //to get position from offset parent
            if (option.left != 'auto') {
                left = iMethods.getPxSize(option.left, cWidth);
            }
            if (option.top != 'auto') {
                top = iMethods.getPxSize(option.top, cHeight);
            }
            if (!cntWin) {
                var oParPos = trigger.offsetParent().offset();
                if (btChck) {
                    left = left + cLeft - $(window).scrollLeft();
                    top = top + cTop - $(window).scrollTop();
                } else {
                    left = left - (cLeft - oParPos.left);
                    top = top - (cTop - oParPos.top);
                }
            }
            cssObj.left = left + ha + 'px';
            cssObj.top = top + va + 'px';

            menu.css(cssObj);

            //to call after open call back
            option.afterOpen.call(this, clbckData, e);


            //to add current menu class
            if (trigger.closest('.iw-contextMenu').length == 0) {
                $('.iw-curMenu').removeClass('iw-curMenu');
                menu.addClass('iw-curMenu');
            }


            var dataParm = {
                trigger: trigger,
                menu: menu,
                option: option,
                method: trgrData.method
            };
            $('html').unbind('click', iMethods.clickEvent).click(dataParm, iMethods.clickEvent);
            $(document).unbind('keydown', iMethods.keyEvent).keydown(dataParm, iMethods.keyEvent);
            if (option.winEventClose) {
                $(window).bind('scroll resize', dataParm, iMethods.scrollEvent);
            }
        },

        scrollEvent: function(e) {
            iMethods.closeContextMenu(e.data.option, e.data.trigger, e.data.menu, e);
        },

        clickEvent: function(e) {
            var button = e.data.trigger.get(0);

            if ((button !== e.target) && ($(e.target).closest('.iw-contextMenu').length == 0)) {
                iMethods.closeContextMenu(e.data.option, e.data.trigger, e.data.menu, e);
            }
        },
        keyEvent: function(e) {
            e.preventDefault();
            var menu = e.data.menu,
                option = e.data.option,
                keyCode = e.keyCode;
            // handle cursor keys
            if (keyCode == 27) {
                iMethods.closeContextMenu(option, e.data.trigger, menu, e);
            }
            if (e.data.method == 'menu') {
                var curMenu = $('.iw-curMenu'),
                    optList = curMenu.children('li:not(.iw-mDisable)'),
                    selected = optList.filter('.iw-mSelected'),
                    index = optList.index(selected),
                    focusOn = function(elm) {
                        iMethods.selectMenu(curMenu, elm);
                        var menuData = elm.data('iw-menuData');
                        if (menuData) {
                            iMethods.eventHandler.call(elm[0], e);

                        }
                    },
                    first = function() {
                        focusOn(optList.filter(':first'));
                    },
                    last = function() {
                        focusOn(optList.filter(':last'));
                    },
                    next = function() {
                        focusOn(optList.filter(':eq(' + (index + 1) + ')'));
                    },
                    prev = function() {
                        focusOn(optList.filter(':eq(' + (index - 1) + ')'));
                    },
                    subMenu = function() {
                        var menuData = selected.data('iw-menuData');
                        if (menuData) {
                            iMethods.eventHandler.call(selected[0], e);
                            var selector = menuData.menu;
                            selector.addClass('iw-curMenu');
                            curMenu.removeClass('iw-curMenu');
                            curMenu = selector;
                            optList = curMenu.children('li:not(.iw-mDisable)');
                            selected = optList.filter('.iw-mSelected');
                            first();
                        }
                    },
                    parMenu = function() {
                        var selector = curMenu.data('iw-menuData').trigger;
                        var parMenu = selector.closest('.iw-contextMenu');
                        if (parMenu.length != 0) {
                            curMenu.removeClass('iw-curMenu').css('display', 'none');
                            parMenu.addClass('iw-curMenu');
                        }
                    };
                switch (keyCode) {
                    case 13:
                        selected.click();
                        break;
                    case 40:
                        (index == optList.length - 1 || selected.length == 0) ? first() : next();
                        break;
                    case 38:
                        (index == 0 || selected.length == 0) ? last() : prev();
                        break;
                    case 33:
                        first();
                        break;
                    case 34:
                        last();
                        break;
                    case 37:
                        parMenu();
                        break;
                    case 39:
                        subMenu();
                        break;
                }
            }
        },
        closeContextMenu: function(option, trigger, menu, e) {

            //unbind all events from top DOM
            $(document).unbind('keydown', iMethods.keyEvent);
            $('html').unbind('click', iMethods.clickEvent);
            $(window).unbind('scroll resize', iMethods.scrollEvent);
            $('.iw-contextMenu').css('display', 'none');
            $(document).focus();

            //call close function
            option.onClose.call(this, {
                trigger: trigger,
                menu: menu
            }, e);
        },
        getPxSize: function(size, of) {
            if (!isNaN(size)) {
                return size;
            }
            if (size.indexOf('%') != -1) {
                return parseInt(size) * of / 100;
            } else {
                return parseInt(size);
            }
        },
        selectMenu: function(menu, elm) {
            //to select the list
            var selected = menu.find('li.iw-mSelected'),
                submenu = selected.find('.iw-contextMenu');
            if ((submenu.length != 0) && (selected[0] != elm[0])) {
                submenu.fadeOut(100);
            }
            selected.removeClass('iw-mSelected');
            elm.addClass('iw-mSelected');
        },
        menuHover: function(menu) {
            var lastEventTime = Date.now();
            menu.children('li').bind('mouseenter.contextMenu click.contextMenu', function(e) {
                //to make curmenu
                $('.iw-curMenu').removeClass('iw-curMenu');
                menu.addClass('iw-curMenu');
                iMethods.selectMenu(menu, $(this));
            });
        },
        createMenuList: function(trgr, selector, option) {
            var baseTrigger = option.baseTrigger,
                randomNum = Math.floor(Math.random() * 10000);
            if ((typeof selector == 'object') && (!selector.nodeType) && (!selector.jquery)) {
                var menuList = $('<ul class="iw-contextMenu iw-created iw-cm-menu" id="iw-contextMenu' + randomNum + '"></ul>');
                $.each(selector, function(index, selObj) {
                    var name = selObj.name,
                        fun = selObj.fun || function() {},
                        subMenu = selObj.subMenu,
                        img = selObj.img || '',
                        title = selObj.title || "",
                        className = selObj.className || "",
                        disable = selObj.disable,
                        list = $('<li title="' + title + '" class="' + className + '">' + name + '</li>');

                    if (img) {
                        list.prepend('<img src="' + img + '" align="absmiddle" class="iw-mIcon" />');
                    }

                    //to add disable
                    if (disable) {
                        list.addClass('iw-mDisable');
                    }

                    if (!subMenu) {
                        list.bind('click.contextMenu', function(e) {
                            fun.call(this, {
                                trigger: baseTrigger,
                                menu: menuList
                            }, e);
                        });
                    }

                    //to create sub menu
                    menuList.append(list);
                    if (subMenu) {
                        list.addClass('iw-has-submenu').append('<div class="iw-cm-arrow-right" />');
                        iMethods.subMenu(list, subMenu, baseTrigger, option);
                    }
                });

                if (baseTrigger.index(trgr[0]) == -1) {
                    trgr.append(menuList);
                } else {
                    var par = option.containment == window ? 'body' : option.containment;
                    $(par).append(menuList);
                }

                iMethods.onOff($('#iw-contextMenu' + randomNum));
                return '#iw-contextMenu' + randomNum;
            } else if ($(selector).length != 0) {
                var element = $(selector);
                element.removeClass('iw-contextMenuCurrent')
                    .addClass('iw-contextMenu iw-cm-menu iw-contextMenu' + randomNum)
                    .attr('menuId', 'iw-contextMenu' + randomNum)
                    .css('display', 'none');

                //to create subMenu
                element.find('ul').each(function(index, element) {
                    var subMenu = $(this),
                        parent = subMenu.parent('li');
                    parent.append('<div class="iw-cm-arrow-right" />');
                    subMenu.addClass('iw-contextMenuCurrent');
                    iMethods.subMenu(parent, '.iw-contextMenuCurrent', baseTrigger, option);
                });
                iMethods.onOff($('.iw-contextMenu' + randomNum));
                return '.iw-contextMenu' + randomNum;
            }
        },
        subMenu: function(trigger, selector, baseTrigger, option) {
            trigger.contextMenu('menu', selector, {
                triggerOn: option.subMenuTriggerOn,
                displayAround: 'trigger',
                position: 'auto',
                mouseClick: 'left',
                baseTrigger: baseTrigger,
                containment: option.containment
            });
        },
        onOff: function(menu) {

            menu.find('.iw-mOverlay').remove();
            menu.find('.iw-mDisable').each(function() {
                var list = $(this);
                list.append('<div class="iw-mOverlay"/>');
                list.find('.iw-mOverlay').bind('click mouseenter', function(event) {
                    event.stopPropagation();
                });

            });

        },
        optionOtimizer: function(method, option) {
            if (!option) {
                return;
            }
            if (method == 'menu') {
                if (!option.mouseClick) {
                    option.mouseClick = 'right';
                }
            }
            if ((option.mouseClick == 'right') && (option.triggerOn == 'click')) {
                option.triggerOn = 'contextmenu';
            }

            if ($.inArray(option.triggerOn, ['hover', 'mouseenter', 'mouseover', 'mouseleave', 'mouseout', 'focusin', 'focusout']) != -1) {
                option.displayAround = 'trigger';
            }
            return option;
        }
    };
})(jQuery, window, document);;
/*! jQuery UI - v1.9.2 - 2014-03-05
* http://jqueryui.com
* Includes: jquery.ui.core.js, jquery.ui.widget.js, jquery.ui.mouse.js, jquery.ui.draggable.js
* Copyright 2014 jQuery Foundation and other contributors; Licensed MIT */

(function( $, undefined ) {

var uuid = 0,
	runiqueId = /^ui-id-\d+$/;

// prevent duplicate loading
// this is only a problem because we proxy existing functions
// and we don't want to double proxy them
$.ui = $.ui || {};
if ( $.ui.version ) {
	return;
}

$.extend( $.ui, {
	version: "1.9.2",

	keyCode: {
		BACKSPACE: 8,
		COMMA: 188,
		DELETE: 46,
		DOWN: 40,
		END: 35,
		ENTER: 13,
		ESCAPE: 27,
		HOME: 36,
		LEFT: 37,
		NUMPAD_ADD: 107,
		NUMPAD_DECIMAL: 110,
		NUMPAD_DIVIDE: 111,
		NUMPAD_ENTER: 108,
		NUMPAD_MULTIPLY: 106,
		NUMPAD_SUBTRACT: 109,
		PAGE_DOWN: 34,
		PAGE_UP: 33,
		PERIOD: 190,
		RIGHT: 39,
		SPACE: 32,
		TAB: 9,
		UP: 38
	}
});

// plugins
$.fn.extend({
	_focus: $.fn.focus,
	focus: function( delay, fn ) {
		return typeof delay === "number" ?
			this.each(function() {
				var elem = this;
				setTimeout(function() {
					$( elem ).focus();
					if ( fn ) {
						fn.call( elem );
					}
				}, delay );
			}) :
			this._focus.apply( this, arguments );
	},

	scrollParent: function() {
		var scrollParent;
		if (($.ui.ie && (/(static|relative)/).test(this.css('position'))) || (/absolute/).test(this.css('position'))) {
			scrollParent = this.parents().filter(function() {
				return (/(relative|absolute|fixed)/).test($.css(this,'position')) && (/(auto|scroll)/).test($.css(this,'overflow')+$.css(this,'overflow-y')+$.css(this,'overflow-x'));
			}).eq(0);
		} else {
			scrollParent = this.parents().filter(function() {
				return (/(auto|scroll)/).test($.css(this,'overflow')+$.css(this,'overflow-y')+$.css(this,'overflow-x'));
			}).eq(0);
		}

		return (/fixed/).test(this.css('position')) || !scrollParent.length ? $(document) : scrollParent;
	},

	zIndex: function( zIndex ) {
		if ( zIndex !== undefined ) {
			return this.css( "zIndex", zIndex );
		}

		if ( this.length ) {
			var elem = $( this[ 0 ] ), position, value;
			while ( elem.length && elem[ 0 ] !== document ) {
				// Ignore z-index if position is set to a value where z-index is ignored by the browser
				// This makes behavior of this function consistent across browsers
				// WebKit always returns auto if the element is positioned
				position = elem.css( "position" );
				if ( position === "absolute" || position === "relative" || position === "fixed" ) {
					// IE returns 0 when zIndex is not specified
					// other browsers return a string
					// we ignore the case of nested elements with an explicit value of 0
					// <div style="z-index: -10;"><div style="z-index: 0;"></div></div>
					value = parseInt( elem.css( "zIndex" ), 10 );
					if ( !isNaN( value ) && value !== 0 ) {
						return value;
					}
				}
				elem = elem.parent();
			}
		}

		return 0;
	},

	uniqueId: function() {
		return this.each(function() {
			if ( !this.id ) {
				this.id = "ui-id-" + (++uuid);
			}
		});
	},

	removeUniqueId: function() {
		return this.each(function() {
			if ( runiqueId.test( this.id ) ) {
				$( this ).removeAttr( "id" );
			}
		});
	}
});

// selectors
function focusable( element, isTabIndexNotNaN ) {
	var map, mapName, img,
		nodeName = element.nodeName.toLowerCase();
	if ( "area" === nodeName ) {
		map = element.parentNode;
		mapName = map.name;
		if ( !element.href || !mapName || map.nodeName.toLowerCase() !== "map" ) {
			return false;
		}
		img = $( "img[usemap=#" + mapName + "]" )[0];
		return !!img && visible( img );
	}
	return ( /input|select|textarea|button|object/.test( nodeName ) ?
		!element.disabled :
		"a" === nodeName ?
			element.href || isTabIndexNotNaN :
			isTabIndexNotNaN) &&
		// the element and all of its ancestors must be visible
		visible( element );
}

function visible( element ) {
	return $.expr.filters.visible( element ) &&
		!$( element ).parents().andSelf().filter(function() {
			return $.css( this, "visibility" ) === "hidden";
		}).length;
}

$.extend( $.expr[ ":" ], {
	data: $.expr.createPseudo ?
		$.expr.createPseudo(function( dataName ) {
			return function( elem ) {
				return !!$.data( elem, dataName );
			};
		}) :
		// support: jQuery <1.8
		function( elem, i, match ) {
			return !!$.data( elem, match[ 3 ] );
		},

	focusable: function( element ) {
		return focusable( element, !isNaN( $.attr( element, "tabindex" ) ) );
	},

	tabbable: function( element ) {
		var tabIndex = $.attr( element, "tabindex" ),
			isTabIndexNaN = isNaN( tabIndex );
		return ( isTabIndexNaN || tabIndex >= 0 ) && focusable( element, !isTabIndexNaN );
	}
});

// support
$(function() {
	var body = document.body,
		div = body.appendChild( div = document.createElement( "div" ) );

	// access offsetHeight before setting the style to prevent a layout bug
	// in IE 9 which causes the element to continue to take up space even
	// after it is removed from the DOM (#8026)
	div.offsetHeight;

	$.extend( div.style, {
		minHeight: "100px",
		height: "auto",
		padding: 0,
		borderWidth: 0
	});

	$.support.minHeight = div.offsetHeight === 100;
	$.support.selectstart = "onselectstart" in div;

	// set display to none to avoid a layout bug in IE
	// http://dev.jquery.com/ticket/4014
	body.removeChild( div ).style.display = "none";
});

// support: jQuery <1.8
if ( !$( "<a>" ).outerWidth( 1 ).jquery ) {
	$.each( [ "Width", "Height" ], function( i, name ) {
		var side = name === "Width" ? [ "Left", "Right" ] : [ "Top", "Bottom" ],
			type = name.toLowerCase(),
			orig = {
				innerWidth: $.fn.innerWidth,
				innerHeight: $.fn.innerHeight,
				outerWidth: $.fn.outerWidth,
				outerHeight: $.fn.outerHeight
			};

		function reduce( elem, size, border, margin ) {
			$.each( side, function() {
				size -= parseFloat( $.css( elem, "padding" + this ) ) || 0;
				if ( border ) {
					size -= parseFloat( $.css( elem, "border" + this + "Width" ) ) || 0;
				}
				if ( margin ) {
					size -= parseFloat( $.css( elem, "margin" + this ) ) || 0;
				}
			});
			return size;
		}

		$.fn[ "inner" + name ] = function( size ) {
			if ( size === undefined ) {
				return orig[ "inner" + name ].call( this );
			}

			return this.each(function() {
				$( this ).css( type, reduce( this, size ) + "px" );
			});
		};

		$.fn[ "outer" + name] = function( size, margin ) {
			if ( typeof size !== "number" ) {
				return orig[ "outer" + name ].call( this, size );
			}

			return this.each(function() {
				$( this).css( type, reduce( this, size, true, margin ) + "px" );
			});
		};
	});
}

// support: jQuery 1.6.1, 1.6.2 (http://bugs.jquery.com/ticket/9413)
if ( $( "<a>" ).data( "a-b", "a" ).removeData( "a-b" ).data( "a-b" ) ) {
	$.fn.removeData = (function( removeData ) {
		return function( key ) {
			if ( arguments.length ) {
				return removeData.call( this, $.camelCase( key ) );
			} else {
				return removeData.call( this );
			}
		};
	})( $.fn.removeData );
}





// deprecated

(function() {
	var uaMatch = /msie ([\w.]+)/.exec( navigator.userAgent.toLowerCase() ) || [];
	$.ui.ie = uaMatch.length ? true : false;
	$.ui.ie6 = parseFloat( uaMatch[ 1 ], 10 ) === 6;
})();

$.fn.extend({
	disableSelection: function() {
		return this.bind( ( $.support.selectstart ? "selectstart" : "mousedown" ) +
			".ui-disableSelection", function( event ) {
				event.preventDefault();
			});
	},

	enableSelection: function() {
		return this.unbind( ".ui-disableSelection" );
	}
});

$.extend( $.ui, {
	// $.ui.plugin is deprecated.  Use the proxy pattern instead.
	plugin: {
		add: function( module, option, set ) {
			var i,
				proto = $.ui[ module ].prototype;
			for ( i in set ) {
				proto.plugins[ i ] = proto.plugins[ i ] || [];
				proto.plugins[ i ].push( [ option, set[ i ] ] );
			}
		},
		call: function( instance, name, args ) {
			var i,
				set = instance.plugins[ name ];
			if ( !set || !instance.element[ 0 ].parentNode || instance.element[ 0 ].parentNode.nodeType === 11 ) {
				return;
			}

			for ( i = 0; i < set.length; i++ ) {
				if ( instance.options[ set[ i ][ 0 ] ] ) {
					set[ i ][ 1 ].apply( instance.element, args );
				}
			}
		}
	},

	contains: $.contains,

	// only used by resizable
	hasScroll: function( el, a ) {

		//If overflow is hidden, the element might have extra content, but the user wants to hide it
		if ( $( el ).css( "overflow" ) === "hidden") {
			return false;
		}

		var scroll = ( a && a === "left" ) ? "scrollLeft" : "scrollTop",
			has = false;

		if ( el[ scroll ] > 0 ) {
			return true;
		}

		// TODO: determine which cases actually cause this to happen
		// if the element doesn't have the scroll set, see if it's possible to
		// set the scroll
		el[ scroll ] = 1;
		has = ( el[ scroll ] > 0 );
		el[ scroll ] = 0;
		return has;
	},

	// these are odd functions, fix the API or move into individual plugins
	isOverAxis: function( x, reference, size ) {
		//Determines when x coordinate is over "b" element axis
		return ( x > reference ) && ( x < ( reference + size ) );
	},
	isOver: function( y, x, top, left, height, width ) {
		//Determines when x, y coordinates is over "b" element
		return $.ui.isOverAxis( y, top, height ) && $.ui.isOverAxis( x, left, width );
	}
});

})( jQuery );
(function( $, undefined ) {

var uuid = 0,
	slice = Array.prototype.slice,
	_cleanData = $.cleanData;
$.cleanData = function( elems ) {
	for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
		try {
			$( elem ).triggerHandler( "remove" );
		// http://bugs.jquery.com/ticket/8235
		} catch( e ) {}
	}
	_cleanData( elems );
};

$.widget = function( name, base, prototype ) {
	var fullName, existingConstructor, constructor, basePrototype,
		namespace = name.split( "." )[ 0 ];

	name = name.split( "." )[ 1 ];
	fullName = namespace + "-" + name;

	if ( !prototype ) {
		prototype = base;
		base = $.Widget;
	}

	// create selector for plugin
	$.expr[ ":" ][ fullName.toLowerCase() ] = function( elem ) {
		return !!$.data( elem, fullName );
	};

	$[ namespace ] = $[ namespace ] || {};
	existingConstructor = $[ namespace ][ name ];
	constructor = $[ namespace ][ name ] = function( options, element ) {
		// allow instantiation without "new" keyword
		if ( !this._createWidget ) {
			return new constructor( options, element );
		}

		// allow instantiation without initializing for simple inheritance
		// must use "new" keyword (the code above always passes args)
		if ( arguments.length ) {
			this._createWidget( options, element );
		}
	};
	// extend with the existing constructor to carry over any static properties
	$.extend( constructor, existingConstructor, {
		version: prototype.version,
		// copy the object used to create the prototype in case we need to
		// redefine the widget later
		_proto: $.extend( {}, prototype ),
		// track widgets that inherit from this widget in case this widget is
		// redefined after a widget inherits from it
		_childConstructors: []
	});

	basePrototype = new base();
	// we need to make the options hash a property directly on the new instance
	// otherwise we'll modify the options hash on the prototype that we're
	// inheriting from
	basePrototype.options = $.widget.extend( {}, basePrototype.options );
	$.each( prototype, function( prop, value ) {
		if ( $.isFunction( value ) ) {
			prototype[ prop ] = (function() {
				var _super = function() {
						return base.prototype[ prop ].apply( this, arguments );
					},
					_superApply = function( args ) {
						return base.prototype[ prop ].apply( this, args );
					};
				return function() {
					var __super = this._super,
						__superApply = this._superApply,
						returnValue;

					this._super = _super;
					this._superApply = _superApply;

					returnValue = value.apply( this, arguments );

					this._super = __super;
					this._superApply = __superApply;

					return returnValue;
				};
			})();
		}
	});
	constructor.prototype = $.widget.extend( basePrototype, {
		// TODO: remove support for widgetEventPrefix
		// always use the name + a colon as the prefix, e.g., draggable:start
		// don't prefix for widgets that aren't DOM-based
		widgetEventPrefix: existingConstructor ? basePrototype.widgetEventPrefix : name
	}, prototype, {
		constructor: constructor,
		namespace: namespace,
		widgetName: name,
		// TODO remove widgetBaseClass, see #8155
		widgetBaseClass: fullName,
		widgetFullName: fullName
	});

	// If this widget is being redefined then we need to find all widgets that
	// are inheriting from it and redefine all of them so that they inherit from
	// the new version of this widget. We're essentially trying to replace one
	// level in the prototype chain.
	if ( existingConstructor ) {
		$.each( existingConstructor._childConstructors, function( i, child ) {
			var childPrototype = child.prototype;

			// redefine the child widget using the same prototype that was
			// originally used, but inherit from the new version of the base
			$.widget( childPrototype.namespace + "." + childPrototype.widgetName, constructor, child._proto );
		});
		// remove the list of existing child constructors from the old constructor
		// so the old child constructors can be garbage collected
		delete existingConstructor._childConstructors;
	} else {
		base._childConstructors.push( constructor );
	}

	$.widget.bridge( name, constructor );
};

$.widget.extend = function( target ) {
	var input = slice.call( arguments, 1 ),
		inputIndex = 0,
		inputLength = input.length,
		key,
		value;
	for ( ; inputIndex < inputLength; inputIndex++ ) {
		for ( key in input[ inputIndex ] ) {
			value = input[ inputIndex ][ key ];
			if ( input[ inputIndex ].hasOwnProperty( key ) && value !== undefined ) {
				// Clone objects
				if ( $.isPlainObject( value ) ) {
					target[ key ] = $.isPlainObject( target[ key ] ) ?
						$.widget.extend( {}, target[ key ], value ) :
						// Don't extend strings, arrays, etc. with objects
						$.widget.extend( {}, value );
				// Copy everything else by reference
				} else {
					target[ key ] = value;
				}
			}
		}
	}
	return target;
};

$.widget.bridge = function( name, object ) {
	var fullName = object.prototype.widgetFullName || name;
	$.fn[ name ] = function( options ) {
		var isMethodCall = typeof options === "string",
			args = slice.call( arguments, 1 ),
			returnValue = this;

		// allow multiple hashes to be passed on init
		options = !isMethodCall && args.length ?
			$.widget.extend.apply( null, [ options ].concat(args) ) :
			options;

		if ( isMethodCall ) {
			this.each(function() {
				var methodValue,
					instance = $.data( this, fullName );
				if ( !instance ) {
					return $.error( "cannot call methods on " + name + " prior to initialization; " +
						"attempted to call method '" + options + "'" );
				}
				if ( !$.isFunction( instance[options] ) || options.charAt( 0 ) === "_" ) {
					return $.error( "no such method '" + options + "' for " + name + " widget instance" );
				}
				methodValue = instance[ options ].apply( instance, args );
				if ( methodValue !== instance && methodValue !== undefined ) {
					returnValue = methodValue && methodValue.jquery ?
						returnValue.pushStack( methodValue.get() ) :
						methodValue;
					return false;
				}
			});
		} else {
			this.each(function() {
				var instance = $.data( this, fullName );
				if ( instance ) {
					instance.option( options || {} )._init();
				} else {
					$.data( this, fullName, new object( options, this ) );
				}
			});
		}

		return returnValue;
	};
};

$.Widget = function( /* options, element */ ) {};
$.Widget._childConstructors = [];

$.Widget.prototype = {
	widgetName: "widget",
	widgetEventPrefix: "",
	defaultElement: "<div>",
	options: {
		disabled: false,

		// callbacks
		create: null
	},
	_createWidget: function( options, element ) {
		element = $( element || this.defaultElement || this )[ 0 ];
		this.element = $( element );
		this.uuid = uuid++;
		this.eventNamespace = "." + this.widgetName + this.uuid;
		this.options = $.widget.extend( {},
			this.options,
			this._getCreateOptions(),
			options );

		this.bindings = $();
		this.hoverable = $();
		this.focusable = $();

		if ( element !== this ) {
			// 1.9 BC for #7810
			// TODO remove dual storage
			$.data( element, this.widgetName, this );
			$.data( element, this.widgetFullName, this );
			this._on( true, this.element, {
				remove: function( event ) {
					if ( event.target === element ) {
						this.destroy();
					}
				}
			});
			this.document = $( element.style ?
				// element within the document
				element.ownerDocument :
				// element is window or document
				element.document || element );
			this.window = $( this.document[0].defaultView || this.document[0].parentWindow );
		}

		this._create();
		this._trigger( "create", null, this._getCreateEventData() );
		this._init();
	},
	_getCreateOptions: $.noop,
	_getCreateEventData: $.noop,
	_create: $.noop,
	_init: $.noop,

	destroy: function() {
		this._destroy();
		// we can probably remove the unbind calls in 2.0
		// all event bindings should go through this._on()
		this.element
			.unbind( this.eventNamespace )
			// 1.9 BC for #7810
			// TODO remove dual storage
			.removeData( this.widgetName )
			.removeData( this.widgetFullName )
			// support: jquery <1.6.3
			// http://bugs.jquery.com/ticket/9413
			.removeData( $.camelCase( this.widgetFullName ) );
		this.widget()
			.unbind( this.eventNamespace )
			.removeAttr( "aria-disabled" )
			.removeClass(
				this.widgetFullName + "-disabled " +
				"ui-state-disabled" );

		// clean up events and states
		this.bindings.unbind( this.eventNamespace );
		this.hoverable.removeClass( "ui-state-hover" );
		this.focusable.removeClass( "ui-state-focus" );
	},
	_destroy: $.noop,

	widget: function() {
		return this.element;
	},

	option: function( key, value ) {
		var options = key,
			parts,
			curOption,
			i;

		if ( arguments.length === 0 ) {
			// don't return a reference to the internal hash
			return $.widget.extend( {}, this.options );
		}

		if ( typeof key === "string" ) {
			// handle nested keys, e.g., "foo.bar" => { foo: { bar: ___ } }
			options = {};
			parts = key.split( "." );
			key = parts.shift();
			if ( parts.length ) {
				curOption = options[ key ] = $.widget.extend( {}, this.options[ key ] );
				for ( i = 0; i < parts.length - 1; i++ ) {
					curOption[ parts[ i ] ] = curOption[ parts[ i ] ] || {};
					curOption = curOption[ parts[ i ] ];
				}
				key = parts.pop();
				if ( value === undefined ) {
					return curOption[ key ] === undefined ? null : curOption[ key ];
				}
				curOption[ key ] = value;
			} else {
				if ( value === undefined ) {
					return this.options[ key ] === undefined ? null : this.options[ key ];
				}
				options[ key ] = value;
			}
		}

		this._setOptions( options );

		return this;
	},
	_setOptions: function( options ) {
		var key;

		for ( key in options ) {
			this._setOption( key, options[ key ] );
		}

		return this;
	},
	_setOption: function( key, value ) {
		this.options[ key ] = value;

		if ( key === "disabled" ) {
			this.widget()
				.toggleClass( this.widgetFullName + "-disabled ui-state-disabled", !!value )
				.attr( "aria-disabled", value );
			this.hoverable.removeClass( "ui-state-hover" );
			this.focusable.removeClass( "ui-state-focus" );
		}

		return this;
	},

	enable: function() {
		return this._setOption( "disabled", false );
	},
	disable: function() {
		return this._setOption( "disabled", true );
	},

	_on: function( suppressDisabledCheck, element, handlers ) {
		var delegateElement,
			instance = this;

		// no suppressDisabledCheck flag, shuffle arguments
		if ( typeof suppressDisabledCheck !== "boolean" ) {
			handlers = element;
			element = suppressDisabledCheck;
			suppressDisabledCheck = false;
		}


		// no element argument, shuffle and use this.element
		if ( !handlers ) {
			handlers = element;
			element = this.element;
			delegateElement = this.widget();
		} else {
			// accept selectors, DOM elements
			element = delegateElement = $( element );
			this.bindings = this.bindings.add( element );
		}

		$.each( handlers, function( event, handler ) {
			function handlerProxy() {
				// allow widgets to customize the disabled handling
				// - disabled as an array instead of boolean
				// - disabled class as method for disabling individual parts
				if ( !suppressDisabledCheck &&
						( instance.options.disabled === true ||
							$( this ).hasClass( "ui-state-disabled" ) ) ) {
					return;
				}
				return ( typeof handler === "string" ? instance[ handler ] : handler )
					.apply( instance, arguments );
			}

			// copy the guid so direct unbinding works
			if ( typeof handler !== "string" ) {
				handlerProxy.guid = handler.guid =
					handler.guid || handlerProxy.guid || $.guid++;
			}

			var match = event.match( /^(\w+)\s*(.*)$/ ),
				eventName = match[1] + instance.eventNamespace,
				selector = match[2];
			if ( selector ) {
				delegateElement.delegate( selector, eventName, handlerProxy );
			} else {
				element.bind( eventName, handlerProxy );
			}
		});
	},

	_off: function( element, eventName ) {
		eventName = (eventName || "").split( " " ).join( this.eventNamespace + " " ) + this.eventNamespace;
		element.unbind( eventName ).undelegate( eventName );
	},

	_delay: function( handler, delay ) {
		function handlerProxy() {
			return ( typeof handler === "string" ? instance[ handler ] : handler )
				.apply( instance, arguments );
		}
		var instance = this;
		return setTimeout( handlerProxy, delay || 0 );
	},

	_hoverable: function( element ) {
		this.hoverable = this.hoverable.add( element );
		this._on( element, {
			mouseenter: function( event ) {
				$( event.currentTarget ).addClass( "ui-state-hover" );
			},
			mouseleave: function( event ) {
				$( event.currentTarget ).removeClass( "ui-state-hover" );
			}
		});
	},

	_focusable: function( element ) {
		this.focusable = this.focusable.add( element );
		this._on( element, {
			focusin: function( event ) {
				$( event.currentTarget ).addClass( "ui-state-focus" );
			},
			focusout: function( event ) {
				$( event.currentTarget ).removeClass( "ui-state-focus" );
			}
		});
	},

	_trigger: function( type, event, data ) {
		var prop, orig,
			callback = this.options[ type ];

		data = data || {};
		event = $.Event( event );
		event.type = ( type === this.widgetEventPrefix ?
			type :
			this.widgetEventPrefix + type ).toLowerCase();
		// the original event may come from any element
		// so we need to reset the target on the new event
		event.target = this.element[ 0 ];

		// copy original event properties over to the new event
		orig = event.originalEvent;
		if ( orig ) {
			for ( prop in orig ) {
				if ( !( prop in event ) ) {
					event[ prop ] = orig[ prop ];
				}
			}
		}

		this.element.trigger( event, data );
		return !( $.isFunction( callback ) &&
			callback.apply( this.element[0], [ event ].concat( data ) ) === false ||
			event.isDefaultPrevented() );
	}
};

$.each( { show: "fadeIn", hide: "fadeOut" }, function( method, defaultEffect ) {
	$.Widget.prototype[ "_" + method ] = function( element, options, callback ) {
		if ( typeof options === "string" ) {
			options = { effect: options };
		}
		var hasOptions,
			effectName = !options ?
				method :
				options === true || typeof options === "number" ?
					defaultEffect :
					options.effect || defaultEffect;
		options = options || {};
		if ( typeof options === "number" ) {
			options = { duration: options };
		}
		hasOptions = !$.isEmptyObject( options );
		options.complete = callback;
		if ( options.delay ) {
			element.delay( options.delay );
		}
		if ( hasOptions && $.effects && ( $.effects.effect[ effectName ] || $.uiBackCompat !== false && $.effects[ effectName ] ) ) {
			element[ method ]( options );
		} else if ( effectName !== method && element[ effectName ] ) {
			element[ effectName ]( options.duration, options.easing, callback );
		} else {
			element.queue(function( next ) {
				$( this )[ method ]();
				if ( callback ) {
					callback.call( element[ 0 ] );
				}
				next();
			});
		}
	};
});

// DEPRECATED
if ( $.uiBackCompat !== false ) {
	$.Widget.prototype._getCreateOptions = function() {
		return $.metadata && $.metadata.get( this.element[0] )[ this.widgetName ];
	};
}

})( jQuery );
(function( $, undefined ) {

var mouseHandled = false;
$( document ).mouseup( function( e ) {
	mouseHandled = false;
});

$.widget("ui.mouse", {
	version: "1.9.2",
	options: {
		cancel: 'input,textarea,button,select,option',
		distance: 1,
		delay: 0
	},
	_mouseInit: function() {
		var that = this;

		this.element
			.bind('mousedown.'+this.widgetName, function(event) {
				return that._mouseDown(event);
			})
			.bind('click.'+this.widgetName, function(event) {
				if (true === $.data(event.target, that.widgetName + '.preventClickEvent')) {
					$.removeData(event.target, that.widgetName + '.preventClickEvent');
					event.stopImmediatePropagation();
					return false;
				}
			});

		this.started = false;
	},

	// TODO: make sure destroying one instance of mouse doesn't mess with
	// other instances of mouse
	_mouseDestroy: function() {
		this.element.unbind('.'+this.widgetName);
		if ( this._mouseMoveDelegate ) {
			$(document)
				.unbind('mousemove.'+this.widgetName, this._mouseMoveDelegate)
				.unbind('mouseup.'+this.widgetName, this._mouseUpDelegate);
		}
	},

	_mouseDown: function(event) {
		// don't let more than one widget handle mouseStart
		if( mouseHandled ) { return; }

		// we may have missed mouseup (out of window)
		(this._mouseStarted && this._mouseUp(event));

		this._mouseDownEvent = event;

		var that = this,
			btnIsLeft = (event.which === 1),
			// event.target.nodeName works around a bug in IE 8 with
			// disabled inputs (#7620)
			elIsCancel = (typeof this.options.cancel === "string" && event.target.nodeName ? $(event.target).closest(this.options.cancel).length : false);
		if (!btnIsLeft || elIsCancel || !this._mouseCapture(event)) {
			return true;
		}

		this.mouseDelayMet = !this.options.delay;
		if (!this.mouseDelayMet) {
			this._mouseDelayTimer = setTimeout(function() {
				that.mouseDelayMet = true;
			}, this.options.delay);
		}

		if (this._mouseDistanceMet(event) && this._mouseDelayMet(event)) {
			this._mouseStarted = (this._mouseStart(event) !== false);
			if (!this._mouseStarted) {
				event.preventDefault();
				return true;
			}
		}

		// Click event may never have fired (Gecko & Opera)
		if (true === $.data(event.target, this.widgetName + '.preventClickEvent')) {
			$.removeData(event.target, this.widgetName + '.preventClickEvent');
		}

		// these delegates are required to keep context
		this._mouseMoveDelegate = function(event) {
			return that._mouseMove(event);
		};
		this._mouseUpDelegate = function(event) {
			return that._mouseUp(event);
		};
		$(document)
			.bind('mousemove.'+this.widgetName, this._mouseMoveDelegate)
			.bind('mouseup.'+this.widgetName, this._mouseUpDelegate);

		event.preventDefault();

		mouseHandled = true;
		return true;
	},

	_mouseMove: function(event) {
		// IE mouseup check - mouseup happened when mouse was out of window
		if ($.ui.ie && !(document.documentMode >= 9) && !event.button) {
			return this._mouseUp(event);
		}

		if (this._mouseStarted) {
			this._mouseDrag(event);
			return event.preventDefault();
		}

		if (this._mouseDistanceMet(event) && this._mouseDelayMet(event)) {
			this._mouseStarted =
				(this._mouseStart(this._mouseDownEvent, event) !== false);
			(this._mouseStarted ? this._mouseDrag(event) : this._mouseUp(event));
		}

		return !this._mouseStarted;
	},

	_mouseUp: function(event) {
		$(document)
			.unbind('mousemove.'+this.widgetName, this._mouseMoveDelegate)
			.unbind('mouseup.'+this.widgetName, this._mouseUpDelegate);

		if (this._mouseStarted) {
			this._mouseStarted = false;

			if (event.target === this._mouseDownEvent.target) {
				$.data(event.target, this.widgetName + '.preventClickEvent', true);
			}

			this._mouseStop(event);
		}

		return false;
	},

	_mouseDistanceMet: function(event) {
		return (Math.max(
				Math.abs(this._mouseDownEvent.pageX - event.pageX),
				Math.abs(this._mouseDownEvent.pageY - event.pageY)
			) >= this.options.distance
		);
	},

	_mouseDelayMet: function(event) {
		return this.mouseDelayMet;
	},

	// These are placeholder methods, to be overriden by extending plugin
	_mouseStart: function(event) {},
	_mouseDrag: function(event) {},
	_mouseStop: function(event) {},
	_mouseCapture: function(event) { return true; }
});

})(jQuery);
(function( $, undefined ) {

$.widget("ui.draggable", $.ui.mouse, {
	version: "1.9.2",
	widgetEventPrefix: "drag",
	options: {
		addClasses: true,
		appendTo: "parent",
		axis: false,
		connectToSortable: false,
		containment: false,
		cursor: "auto",
		cursorAt: false,
		grid: false,
		handle: false,
		helper: "original",
		iframeFix: false,
		opacity: false,
		refreshPositions: false,
		revert: false,
		revertDuration: 500,
		scope: "default",
		scroll: true,
		scrollSensitivity: 20,
		scrollSpeed: 20,
		snap: false,
		snapMode: "both",
		snapTolerance: 20,
		stack: false,
		zIndex: false
	},
	_create: function() {

		if (this.options.helper == 'original' && !(/^(?:r|a|f)/).test(this.element.css("position")))
			this.element[0].style.position = 'relative';

		(this.options.addClasses && this.element.addClass("ui-draggable"));
		(this.options.disabled && this.element.addClass("ui-draggable-disabled"));

		this._mouseInit();

	},

	_destroy: function() {
		this.element.removeClass( "ui-draggable ui-draggable-dragging ui-draggable-disabled" );
		this._mouseDestroy();
	},

	_mouseCapture: function(event) {

		var o = this.options;

		// among others, prevent a drag on a resizable-handle
		if (this.helper || o.disabled || $(event.target).is('.ui-resizable-handle'))
			return false;

		//Quit if we're not on a valid handle
		this.handle = this._getHandle(event);
		if (!this.handle)
			return false;

		$(o.iframeFix === true ? "iframe" : o.iframeFix).each(function() {
			$('<div class="ui-draggable-iframeFix" style="background: #fff;"></div>')
			.css({
				width: this.offsetWidth+"px", height: this.offsetHeight+"px",
				position: "absolute", opacity: "0.001", zIndex: 1000
			})
			.css($(this).offset())
			.appendTo("body");
		});

		return true;

	},

	_mouseStart: function(event) {

		var o = this.options;

		//Create and append the visible helper
		this.helper = this._createHelper(event);

		this.helper.addClass("ui-draggable-dragging");

		//Cache the helper size
		this._cacheHelperProportions();

		//If ddmanager is used for droppables, set the global draggable
		if($.ui.ddmanager)
			$.ui.ddmanager.current = this;

		/*
		 * - Position generation -
		 * This block generates everything position related - it's the core of draggables.
		 */

		//Cache the margins of the original element
		this._cacheMargins();

		//Store the helper's css position
		this.cssPosition = this.helper.css("position");
		this.scrollParent = this.helper.scrollParent();

		//The element's absolute position on the page minus margins
		this.offset = this.positionAbs = this.element.offset();
		this.offset = {
			top: this.offset.top - this.margins.top,
			left: this.offset.left - this.margins.left
		};

		$.extend(this.offset, {
			click: { //Where the click happened, relative to the element
				left: event.pageX - this.offset.left,
				top: event.pageY - this.offset.top
			},
			parent: this._getParentOffset(),
			relative: this._getRelativeOffset() //This is a relative to absolute position minus the actual position calculation - only used for relative positioned helper
		});

		//Generate the original position
		this.originalPosition = this.position = this._generatePosition(event);
		this.originalPageX = event.pageX;
		this.originalPageY = event.pageY;

		//Adjust the mouse offset relative to the helper if 'cursorAt' is supplied
		(o.cursorAt && this._adjustOffsetFromHelper(o.cursorAt));

		//Set a containment if given in the options
		if(o.containment)
			this._setContainment();

		//Trigger event + callbacks
		if(this._trigger("start", event) === false) {
			this._clear();
			return false;
		}

		//Recache the helper size
		this._cacheHelperProportions();

		//Prepare the droppable offsets
		if ($.ui.ddmanager && !o.dropBehaviour)
			$.ui.ddmanager.prepareOffsets(this, event);


		this._mouseDrag(event, true); //Execute the drag once - this causes the helper not to be visible before getting its correct position

		//If the ddmanager is used for droppables, inform the manager that dragging has started (see #5003)
		if ( $.ui.ddmanager ) $.ui.ddmanager.dragStart(this, event);

		return true;
	},

	_mouseDrag: function(event, noPropagation) {

		//Compute the helpers position
		this.position = this._generatePosition(event);
		this.positionAbs = this._convertPositionTo("absolute");

		//Call plugins and callbacks and use the resulting position if something is returned
		if (!noPropagation) {
			var ui = this._uiHash();
			if(this._trigger('drag', event, ui) === false) {
				this._mouseUp({});
				return false;
			}
			this.position = ui.position;
		}

		if(!this.options.axis || this.options.axis != "y") this.helper[0].style.left = this.position.left+'px';
		if(!this.options.axis || this.options.axis != "x") this.helper[0].style.top = this.position.top+'px';
		if($.ui.ddmanager) $.ui.ddmanager.drag(this, event);

		return false;
	},

	_mouseStop: function(event) {

		//If we are using droppables, inform the manager about the drop
		var dropped = false;
		if ($.ui.ddmanager && !this.options.dropBehaviour)
			dropped = $.ui.ddmanager.drop(this, event);

		//if a drop comes from outside (a sortable)
		if(this.dropped) {
			dropped = this.dropped;
			this.dropped = false;
		}

		//if the original element is no longer in the DOM don't bother to continue (see #8269)
		var element = this.element[0], elementInDom = false;
		while ( element && (element = element.parentNode) ) {
			if (element == document ) {
				elementInDom = true;
			}
		}
		if ( !elementInDom && this.options.helper === "original" )
			return false;

		if((this.options.revert == "invalid" && !dropped) || (this.options.revert == "valid" && dropped) || this.options.revert === true || ($.isFunction(this.options.revert) && this.options.revert.call(this.element, dropped))) {
			var that = this;
			$(this.helper).animate(this.originalPosition, parseInt(this.options.revertDuration, 10), function() {
				if(that._trigger("stop", event) !== false) {
					that._clear();
				}
			});
		} else {
			if(this._trigger("stop", event) !== false) {
				this._clear();
			}
		}

		return false;
	},

	_mouseUp: function(event) {
		//Remove frame helpers
		$("div.ui-draggable-iframeFix").each(function() {
			this.parentNode.removeChild(this);
		});

		//If the ddmanager is used for droppables, inform the manager that dragging has stopped (see #5003)
		if( $.ui.ddmanager ) $.ui.ddmanager.dragStop(this, event);

		return $.ui.mouse.prototype._mouseUp.call(this, event);
	},

	cancel: function() {

		if(this.helper.is(".ui-draggable-dragging")) {
			this._mouseUp({});
		} else {
			this._clear();
		}

		return this;

	},

	_getHandle: function(event) {

		var handle = !this.options.handle || !$(this.options.handle, this.element).length ? true : false;
		$(this.options.handle, this.element)
			.find("*")
			.andSelf()
			.each(function() {
				if(this == event.target) handle = true;
			});

		return handle;

	},

	_createHelper: function(event) {

		var o = this.options;
		var helper = $.isFunction(o.helper) ? $(o.helper.apply(this.element[0], [event])) : (o.helper == 'clone' ? this.element.clone().removeAttr('id') : this.element);

		if(!helper.parents('body').length)
			helper.appendTo((o.appendTo == 'parent' ? this.element[0].parentNode : o.appendTo));

		if(helper[0] != this.element[0] && !(/(fixed|absolute)/).test(helper.css("position")))
			helper.css("position", "absolute");

		return helper;

	},

	_adjustOffsetFromHelper: function(obj) {
		if (typeof obj == 'string') {
			obj = obj.split(' ');
		}
		if ($.isArray(obj)) {
			obj = {left: +obj[0], top: +obj[1] || 0};
		}
		if ('left' in obj) {
			this.offset.click.left = obj.left + this.margins.left;
		}
		if ('right' in obj) {
			this.offset.click.left = this.helperProportions.width - obj.right + this.margins.left;
		}
		if ('top' in obj) {
			this.offset.click.top = obj.top + this.margins.top;
		}
		if ('bottom' in obj) {
			this.offset.click.top = this.helperProportions.height - obj.bottom + this.margins.top;
		}
	},

	_getParentOffset: function() {

		//Get the offsetParent and cache its position
		this.offsetParent = this.helper.offsetParent();
		var po = this.offsetParent.offset();

		// This is a special case where we need to modify a offset calculated on start, since the following happened:
		// 1. The position of the helper is absolute, so it's position is calculated based on the next positioned parent
		// 2. The actual offset parent is a child of the scroll parent, and the scroll parent isn't the document, which means that
		//    the scroll is included in the initial calculation of the offset of the parent, and never recalculated upon drag
		if(this.cssPosition == 'absolute' && this.scrollParent[0] != document && $.contains(this.scrollParent[0], this.offsetParent[0])) {
			po.left += this.scrollParent.scrollLeft();
			po.top += this.scrollParent.scrollTop();
		}

		if((this.offsetParent[0] == document.body) //This needs to be actually done for all browsers, since pageX/pageY includes this information
		|| (this.offsetParent[0].tagName && this.offsetParent[0].tagName.toLowerCase() == 'html' && $.ui.ie)) //Ugly IE fix
			po = { top: 0, left: 0 };

		return {
			top: po.top + (parseInt(this.offsetParent.css("borderTopWidth"),10) || 0),
			left: po.left + (parseInt(this.offsetParent.css("borderLeftWidth"),10) || 0)
		};

	},

	_getRelativeOffset: function() {

		if(this.cssPosition == "relative") {
			var p = this.element.position();
			return {
				top: p.top - (parseInt(this.helper.css("top"),10) || 0) + this.scrollParent.scrollTop(),
				left: p.left - (parseInt(this.helper.css("left"),10) || 0) + this.scrollParent.scrollLeft()
			};
		} else {
			return { top: 0, left: 0 };
		}

	},

	_cacheMargins: function() {
		this.margins = {
			left: (parseInt(this.element.css("marginLeft"),10) || 0),
			top: (parseInt(this.element.css("marginTop"),10) || 0),
			right: (parseInt(this.element.css("marginRight"),10) || 0),
			bottom: (parseInt(this.element.css("marginBottom"),10) || 0)
		};
	},

	_cacheHelperProportions: function() {
		this.helperProportions = {
			width: this.helper.outerWidth(),
			height: this.helper.outerHeight()
		};
	},

	_setContainment: function() {

		var o = this.options;
		if(o.containment == 'parent') o.containment = this.helper[0].parentNode;
		if(o.containment == 'document' || o.containment == 'window') this.containment = [
			o.containment == 'document' ? 0 : $(window).scrollLeft() - this.offset.relative.left - this.offset.parent.left,
			o.containment == 'document' ? 0 : $(window).scrollTop() - this.offset.relative.top - this.offset.parent.top,
			(o.containment == 'document' ? 0 : $(window).scrollLeft()) + $(o.containment == 'document' ? document : window).width() - this.helperProportions.width - this.margins.left,
			(o.containment == 'document' ? 0 : $(window).scrollTop()) + ($(o.containment == 'document' ? document : window).height() || document.body.parentNode.scrollHeight) - this.helperProportions.height - this.margins.top
		];

		if(!(/^(document|window|parent)$/).test(o.containment) && o.containment.constructor != Array) {
			var c = $(o.containment);
			var ce = c[0]; if(!ce) return;
			var co = c.offset();
			var over = ($(ce).css("overflow") != 'hidden');

			this.containment = [
				(parseInt($(ce).css("borderLeftWidth"),10) || 0) + (parseInt($(ce).css("paddingLeft"),10) || 0),
				(parseInt($(ce).css("borderTopWidth"),10) || 0) + (parseInt($(ce).css("paddingTop"),10) || 0),
				(over ? Math.max(ce.scrollWidth,ce.offsetWidth) : ce.offsetWidth) - (parseInt($(ce).css("borderLeftWidth"),10) || 0) - (parseInt($(ce).css("paddingRight"),10) || 0) - this.helperProportions.width - this.margins.left - this.margins.right,
				(over ? Math.max(ce.scrollHeight,ce.offsetHeight) : ce.offsetHeight) - (parseInt($(ce).css("borderTopWidth"),10) || 0) - (parseInt($(ce).css("paddingBottom"),10) || 0) - this.helperProportions.height - this.margins.top  - this.margins.bottom
			];
			this.relative_container = c;

		} else if(o.containment.constructor == Array) {
			this.containment = o.containment;
		}

	},

	_convertPositionTo: function(d, pos) {

		if(!pos) pos = this.position;
		var mod = d == "absolute" ? 1 : -1;
		var o = this.options, scroll = this.cssPosition == 'absolute' && !(this.scrollParent[0] != document && $.contains(this.scrollParent[0], this.offsetParent[0])) ? this.offsetParent : this.scrollParent, scrollIsRootNode = (/(html|body)/i).test(scroll[0].tagName);

		return {
			top: (
				pos.top																	// The absolute mouse position
				+ this.offset.relative.top * mod										// Only for relative positioned nodes: Relative offset from element to offset parent
				+ this.offset.parent.top * mod											// The offsetParent's offset without borders (offset + border)
				- ( ( this.cssPosition == 'fixed' ? -this.scrollParent.scrollTop() : ( scrollIsRootNode ? 0 : scroll.scrollTop() ) ) * mod)
			),
			left: (
				pos.left																// The absolute mouse position
				+ this.offset.relative.left * mod										// Only for relative positioned nodes: Relative offset from element to offset parent
				+ this.offset.parent.left * mod											// The offsetParent's offset without borders (offset + border)
				- ( ( this.cssPosition == 'fixed' ? -this.scrollParent.scrollLeft() : scrollIsRootNode ? 0 : scroll.scrollLeft() ) * mod)
			)
		};

	},

	_generatePosition: function(event) {

		var o = this.options, scroll = this.cssPosition == 'absolute' && !(this.scrollParent[0] != document && $.contains(this.scrollParent[0], this.offsetParent[0])) ? this.offsetParent : this.scrollParent, scrollIsRootNode = (/(html|body)/i).test(scroll[0].tagName);
		var pageX = event.pageX;
		var pageY = event.pageY;

		/*
		 * - Position constraining -
		 * Constrain the position to a mix of grid, containment.
		 */

		if(this.originalPosition) { //If we are not dragging yet, we won't check for options
			var containment;
			if(this.containment) {
			if (this.relative_container){
				var co = this.relative_container.offset();
				containment = [ this.containment[0] + co.left,
					this.containment[1] + co.top,
					this.containment[2] + co.left,
					this.containment[3] + co.top ];
			}
			else {
				containment = this.containment;
			}

				if(event.pageX - this.offset.click.left < containment[0]) pageX = containment[0] + this.offset.click.left;
				if(event.pageY - this.offset.click.top < containment[1]) pageY = containment[1] + this.offset.click.top;
				if(event.pageX - this.offset.click.left > containment[2]) pageX = containment[2] + this.offset.click.left;
				if(event.pageY - this.offset.click.top > containment[3]) pageY = containment[3] + this.offset.click.top;
			}

			if(o.grid) {
				//Check for grid elements set to 0 to prevent divide by 0 error causing invalid argument errors in IE (see ticket #6950)
				var top = o.grid[1] ? this.originalPageY + Math.round((pageY - this.originalPageY) / o.grid[1]) * o.grid[1] : this.originalPageY;
				pageY = containment ? (!(top - this.offset.click.top < containment[1] || top - this.offset.click.top > containment[3]) ? top : (!(top - this.offset.click.top < containment[1]) ? top - o.grid[1] : top + o.grid[1])) : top;

				var left = o.grid[0] ? this.originalPageX + Math.round((pageX - this.originalPageX) / o.grid[0]) * o.grid[0] : this.originalPageX;
				pageX = containment ? (!(left - this.offset.click.left < containment[0] || left - this.offset.click.left > containment[2]) ? left : (!(left - this.offset.click.left < containment[0]) ? left - o.grid[0] : left + o.grid[0])) : left;
			}

		}

		return {
			top: (
				pageY																// The absolute mouse position
				- this.offset.click.top													// Click offset (relative to the element)
				- this.offset.relative.top												// Only for relative positioned nodes: Relative offset from element to offset parent
				- this.offset.parent.top												// The offsetParent's offset without borders (offset + border)
				+ ( ( this.cssPosition == 'fixed' ? -this.scrollParent.scrollTop() : ( scrollIsRootNode ? 0 : scroll.scrollTop() ) ))
			),
			left: (
				pageX																// The absolute mouse position
				- this.offset.click.left												// Click offset (relative to the element)
				- this.offset.relative.left												// Only for relative positioned nodes: Relative offset from element to offset parent
				- this.offset.parent.left												// The offsetParent's offset without borders (offset + border)
				+ ( ( this.cssPosition == 'fixed' ? -this.scrollParent.scrollLeft() : scrollIsRootNode ? 0 : scroll.scrollLeft() ))
			)
		};

	},

	_clear: function() {
		this.helper.removeClass("ui-draggable-dragging");
		if(this.helper[0] != this.element[0] && !this.cancelHelperRemoval) this.helper.remove();
		//if($.ui.ddmanager) $.ui.ddmanager.current = null;
		this.helper = null;
		this.cancelHelperRemoval = false;
	},

	// From now on bulk stuff - mainly helpers

	_trigger: function(type, event, ui) {
		ui = ui || this._uiHash();
		$.ui.plugin.call(this, type, [event, ui]);
		if(type == "drag") this.positionAbs = this._convertPositionTo("absolute"); //The absolute position has to be recalculated after plugins
		return $.Widget.prototype._trigger.call(this, type, event, ui);
	},

	plugins: {},

	_uiHash: function(event) {
		return {
			helper: this.helper,
			position: this.position,
			originalPosition: this.originalPosition,
			offset: this.positionAbs
		};
	}

});

$.ui.plugin.add("draggable", "connectToSortable", {
	start: function(event, ui) {

		var inst = $(this).data("draggable"), o = inst.options,
			uiSortable = $.extend({}, ui, { item: inst.element });
		inst.sortables = [];
		$(o.connectToSortable).each(function() {
			var sortable = $.data(this, 'sortable');
			if (sortable && !sortable.options.disabled) {
				inst.sortables.push({
					instance: sortable,
					shouldRevert: sortable.options.revert
				});
				sortable.refreshPositions();	// Call the sortable's refreshPositions at drag start to refresh the containerCache since the sortable container cache is used in drag and needs to be up to date (this will ensure it's initialised as well as being kept in step with any changes that might have happened on the page).
				sortable._trigger("activate", event, uiSortable);
			}
		});

	},
	stop: function(event, ui) {

		//If we are still over the sortable, we fake the stop event of the sortable, but also remove helper
		var inst = $(this).data("draggable"),
			uiSortable = $.extend({}, ui, { item: inst.element });

		$.each(inst.sortables, function() {
			if(this.instance.isOver) {

				this.instance.isOver = 0;

				inst.cancelHelperRemoval = true; //Don't remove the helper in the draggable instance
				this.instance.cancelHelperRemoval = false; //Remove it in the sortable instance (so sortable plugins like revert still work)

				//The sortable revert is supported, and we have to set a temporary dropped variable on the draggable to support revert: 'valid/invalid'
				if(this.shouldRevert) this.instance.options.revert = true;

				//Trigger the stop of the sortable
				this.instance._mouseStop(event);

				this.instance.options.helper = this.instance.options._helper;

				//If the helper has been the original item, restore properties in the sortable
				if(inst.options.helper == 'original')
					this.instance.currentItem.css({ top: 'auto', left: 'auto' });

			} else {
				this.instance.cancelHelperRemoval = false; //Remove the helper in the sortable instance
				this.instance._trigger("deactivate", event, uiSortable);
			}

		});

	},
	drag: function(event, ui) {

		var inst = $(this).data("draggable"), that = this;

		var checkPos = function(o) {
			var dyClick = this.offset.click.top, dxClick = this.offset.click.left;
			var helperTop = this.positionAbs.top, helperLeft = this.positionAbs.left;
			var itemHeight = o.height, itemWidth = o.width;
			var itemTop = o.top, itemLeft = o.left;

			return $.ui.isOver(helperTop + dyClick, helperLeft + dxClick, itemTop, itemLeft, itemHeight, itemWidth);
		};

		$.each(inst.sortables, function(i) {

			var innermostIntersecting = false;
			var thisSortable = this;
			//Copy over some variables to allow calling the sortable's native _intersectsWith
			this.instance.positionAbs = inst.positionAbs;
			this.instance.helperProportions = inst.helperProportions;
			this.instance.offset.click = inst.offset.click;

			if(this.instance._intersectsWith(this.instance.containerCache)) {
				innermostIntersecting = true;
				$.each(inst.sortables, function () {
					this.instance.positionAbs = inst.positionAbs;
					this.instance.helperProportions = inst.helperProportions;
					this.instance.offset.click = inst.offset.click;
					if  (this != thisSortable
						&& this.instance._intersectsWith(this.instance.containerCache)
						&& $.ui.contains(thisSortable.instance.element[0], this.instance.element[0]))
						innermostIntersecting = false;
						return innermostIntersecting;
				});
			}


			if(innermostIntersecting) {
				//If it intersects, we use a little isOver variable and set it once, so our move-in stuff gets fired only once
				if(!this.instance.isOver) {

					this.instance.isOver = 1;
					//Now we fake the start of dragging for the sortable instance,
					//by cloning the list group item, appending it to the sortable and using it as inst.currentItem
					//We can then fire the start event of the sortable with our passed browser event, and our own helper (so it doesn't create a new one)
					this.instance.currentItem = $(that).clone().removeAttr('id').appendTo(this.instance.element).data("sortable-item", true);
					this.instance.options._helper = this.instance.options.helper; //Store helper option to later restore it
					this.instance.options.helper = function() { return ui.helper[0]; };

					event.target = this.instance.currentItem[0];
					this.instance._mouseCapture(event, true);
					this.instance._mouseStart(event, true, true);

					//Because the browser event is way off the new appended portlet, we modify a couple of variables to reflect the changes
					this.instance.offset.click.top = inst.offset.click.top;
					this.instance.offset.click.left = inst.offset.click.left;
					this.instance.offset.parent.left -= inst.offset.parent.left - this.instance.offset.parent.left;
					this.instance.offset.parent.top -= inst.offset.parent.top - this.instance.offset.parent.top;

					inst._trigger("toSortable", event);
					inst.dropped = this.instance.element; //draggable revert needs that
					//hack so receive/update callbacks work (mostly)
					inst.currentItem = inst.element;
					this.instance.fromOutside = inst;

				}

				//Provided we did all the previous steps, we can fire the drag event of the sortable on every draggable drag, when it intersects with the sortable
				if(this.instance.currentItem) this.instance._mouseDrag(event);

			} else {

				//If it doesn't intersect with the sortable, and it intersected before,
				//we fake the drag stop of the sortable, but make sure it doesn't remove the helper by using cancelHelperRemoval
				if(this.instance.isOver) {

					this.instance.isOver = 0;
					this.instance.cancelHelperRemoval = true;

					//Prevent reverting on this forced stop
					this.instance.options.revert = false;

					// The out event needs to be triggered independently
					this.instance._trigger('out', event, this.instance._uiHash(this.instance));

					this.instance._mouseStop(event, true);
					this.instance.options.helper = this.instance.options._helper;

					//Now we remove our currentItem, the list group clone again, and the placeholder, and animate the helper back to it's original size
					this.instance.currentItem.remove();
					if(this.instance.placeholder) this.instance.placeholder.remove();

					inst._trigger("fromSortable", event);
					inst.dropped = false; //draggable revert needs that
				}

			};

		});

	}
});

$.ui.plugin.add("draggable", "cursor", {
	start: function(event, ui) {
		var t = $('body'), o = $(this).data('draggable').options;
		if (t.css("cursor")) o._cursor = t.css("cursor");
		t.css("cursor", o.cursor);
	},
	stop: function(event, ui) {
		var o = $(this).data('draggable').options;
		if (o._cursor) $('body').css("cursor", o._cursor);
	}
});

$.ui.plugin.add("draggable", "opacity", {
	start: function(event, ui) {
		var t = $(ui.helper), o = $(this).data('draggable').options;
		if(t.css("opacity")) o._opacity = t.css("opacity");
		t.css('opacity', o.opacity);
	},
	stop: function(event, ui) {
		var o = $(this).data('draggable').options;
		if(o._opacity) $(ui.helper).css('opacity', o._opacity);
	}
});

$.ui.plugin.add("draggable", "scroll", {
	start: function(event, ui) {
		var i = $(this).data("draggable");
		if(i.scrollParent[0] != document && i.scrollParent[0].tagName != 'HTML') i.overflowOffset = i.scrollParent.offset();
	},
	drag: function(event, ui) {

		var i = $(this).data("draggable"), o = i.options, scrolled = false;

		if(i.scrollParent[0] != document && i.scrollParent[0].tagName != 'HTML') {

			if(!o.axis || o.axis != 'x') {
				if((i.overflowOffset.top + i.scrollParent[0].offsetHeight) - event.pageY < o.scrollSensitivity)
					i.scrollParent[0].scrollTop = scrolled = i.scrollParent[0].scrollTop + o.scrollSpeed;
				else if(event.pageY - i.overflowOffset.top < o.scrollSensitivity)
					i.scrollParent[0].scrollTop = scrolled = i.scrollParent[0].scrollTop - o.scrollSpeed;
			}

			if(!o.axis || o.axis != 'y') {
				if((i.overflowOffset.left + i.scrollParent[0].offsetWidth) - event.pageX < o.scrollSensitivity)
					i.scrollParent[0].scrollLeft = scrolled = i.scrollParent[0].scrollLeft + o.scrollSpeed;
				else if(event.pageX - i.overflowOffset.left < o.scrollSensitivity)
					i.scrollParent[0].scrollLeft = scrolled = i.scrollParent[0].scrollLeft - o.scrollSpeed;
			}

		} else {

			if(!o.axis || o.axis != 'x') {
				if(event.pageY - $(document).scrollTop() < o.scrollSensitivity)
					scrolled = $(document).scrollTop($(document).scrollTop() - o.scrollSpeed);
				else if($(window).height() - (event.pageY - $(document).scrollTop()) < o.scrollSensitivity)
					scrolled = $(document).scrollTop($(document).scrollTop() + o.scrollSpeed);
			}

			if(!o.axis || o.axis != 'y') {
				if(event.pageX - $(document).scrollLeft() < o.scrollSensitivity)
					scrolled = $(document).scrollLeft($(document).scrollLeft() - o.scrollSpeed);
				else if($(window).width() - (event.pageX - $(document).scrollLeft()) < o.scrollSensitivity)
					scrolled = $(document).scrollLeft($(document).scrollLeft() + o.scrollSpeed);
			}

		}

		if(scrolled !== false && $.ui.ddmanager && !o.dropBehaviour)
			$.ui.ddmanager.prepareOffsets(i, event);

	}
});

$.ui.plugin.add("draggable", "snap", {
	start: function(event, ui) {

		var i = $(this).data("draggable"), o = i.options;
		i.snapElements = [];

		$(o.snap.constructor != String ? ( o.snap.items || ':data(draggable)' ) : o.snap).each(function() {
			var $t = $(this); var $o = $t.offset();
			if(this != i.element[0]) i.snapElements.push({
				item: this,
				width: $t.outerWidth(), height: $t.outerHeight(),
				top: $o.top, left: $o.left
			});
		});

	},
	drag: function(event, ui) {

		var inst = $(this).data("draggable"), o = inst.options;
		var d = o.snapTolerance;

		var x1 = ui.offset.left, x2 = x1 + inst.helperProportions.width,
			y1 = ui.offset.top, y2 = y1 + inst.helperProportions.height;

		for (var i = inst.snapElements.length - 1; i >= 0; i--){

			var l = inst.snapElements[i].left, r = l + inst.snapElements[i].width,
				t = inst.snapElements[i].top, b = t + inst.snapElements[i].height;

			//Yes, I know, this is insane ;)
			if(!((l-d < x1 && x1 < r+d && t-d < y1 && y1 < b+d) || (l-d < x1 && x1 < r+d && t-d < y2 && y2 < b+d) || (l-d < x2 && x2 < r+d && t-d < y1 && y1 < b+d) || (l-d < x2 && x2 < r+d && t-d < y2 && y2 < b+d))) {
				if(inst.snapElements[i].snapping) (inst.options.snap.release && inst.options.snap.release.call(inst.element, event, $.extend(inst._uiHash(), { snapItem: inst.snapElements[i].item })));
				inst.snapElements[i].snapping = false;
				continue;
			}

			if(o.snapMode != 'inner') {
				var ts = Math.abs(t - y2) <= d;
				var bs = Math.abs(b - y1) <= d;
				var ls = Math.abs(l - x2) <= d;
				var rs = Math.abs(r - x1) <= d;
				if(ts) ui.position.top = inst._convertPositionTo("relative", { top: t - inst.helperProportions.height, left: 0 }).top - inst.margins.top;
				if(bs) ui.position.top = inst._convertPositionTo("relative", { top: b, left: 0 }).top - inst.margins.top;
				if(ls) ui.position.left = inst._convertPositionTo("relative", { top: 0, left: l - inst.helperProportions.width }).left - inst.margins.left;
				if(rs) ui.position.left = inst._convertPositionTo("relative", { top: 0, left: r }).left - inst.margins.left;
			}

			var first = (ts || bs || ls || rs);

			if(o.snapMode != 'outer') {
				var ts = Math.abs(t - y1) <= d;
				var bs = Math.abs(b - y2) <= d;
				var ls = Math.abs(l - x1) <= d;
				var rs = Math.abs(r - x2) <= d;
				if(ts) ui.position.top = inst._convertPositionTo("relative", { top: t, left: 0 }).top - inst.margins.top;
				if(bs) ui.position.top = inst._convertPositionTo("relative", { top: b - inst.helperProportions.height, left: 0 }).top - inst.margins.top;
				if(ls) ui.position.left = inst._convertPositionTo("relative", { top: 0, left: l }).left - inst.margins.left;
				if(rs) ui.position.left = inst._convertPositionTo("relative", { top: 0, left: r - inst.helperProportions.width }).left - inst.margins.left;
			}

			if(!inst.snapElements[i].snapping && (ts || bs || ls || rs || first))
				(inst.options.snap.snap && inst.options.snap.snap.call(inst.element, event, $.extend(inst._uiHash(), { snapItem: inst.snapElements[i].item })));
			inst.snapElements[i].snapping = (ts || bs || ls || rs || first);

		};

	}
});

$.ui.plugin.add("draggable", "stack", {
	start: function(event, ui) {

		var o = $(this).data("draggable").options;

		var group = $.makeArray($(o.stack)).sort(function(a,b) {
			return (parseInt($(a).css("zIndex"),10) || 0) - (parseInt($(b).css("zIndex"),10) || 0);
		});
		if (!group.length) { return; }

		var min = parseInt(group[0].style.zIndex) || 0;
		$(group).each(function(i) {
			this.style.zIndex = min + i;
		});

		this[0].style.zIndex = min + group.length;

	}
});

$.ui.plugin.add("draggable", "zIndex", {
	start: function(event, ui) {
		var t = $(ui.helper), o = $(this).data("draggable").options;
		if(t.css("zIndex")) o._zIndex = t.css("zIndex");
		t.css('zIndex', o.zIndex);
	},
	stop: function(event, ui) {
		var o = $(this).data("draggable").options;
		if(o._zIndex) $(ui.helper).css('zIndex', o._zIndex);
	}
});

})(jQuery);;

// JavaScript Document
$(document).ready(function(e) {
/*First Example */
    var menu1 = [{
  	    name: 'create',
  	    img: 'assets/images/create.png',
        className :'primary',
  	    title: 'create button',
  	    fun: function () {
            console.log(arguments);
  	        alert('i am add button')
  	    }
  	}, {
  	    name: 'update',
  	    img: 'assets/images/update.png',
  	    title: 'update button',
  	    fun: function () {
            console.log(arguments);
  	        alert('i am update button')
  	    }
  	}, {
  	    name: 'delete',
  	    img: 'assets/images/delete.png',
  	    title: 'delete button',
  	    fun: function () {
            console.log(arguments);
  	        alert('i am delete button')
  	    }
  	}];

//Calling context menu
 $('#testButton1').contextMenu(menu1);
/*First Example Ends */


/*Second Example */
var menu2 = [{
  	    name: 'create',
  	    img: 'assets/images/create.png',
  	    title: 'create button',
  	    fun: function () {
  	        alert('i am add button')
  	    }
  	}, {
  	    name: 'update',
  	    img: 'assets/images/update.png',
  	    title: 'update button',
  	    subMenu: [{
  	        name: 'merge',
  	        title: 'It will merge row',
            img:'assets/images/merge.png',
  	        fun: function () {
  	            alert('It will merge row')
  	        }
  	    }, {
  	        name: 'replace',
  	        title: 'It will replace row',
            img:'assets/images/replace.png',
            subMenu: [{
  	            name: 'replace top 100',
                img:'assets/images/top.png',
                fun:function(){
                alert('It will replace top 100 rows');
                }

  	        }, {
  	            name: 'replace all',
                img:'assets/images/all.png',
                fun:function(){
                alert('It will replace all rows');
                }
  	        }]
  	    }]
  	}, {
  	    name: 'delete',
  	    img: 'assets/images/delete.png',
  	    title: 'delete button',
  	    subMenu: [{
  	        'name': 'soft delete',
            img:'assets/images/soft_delete.png',
            fun:function(){
            alert('You can recover back');
            }
  	    }, {
  	        'name': 'hard delete',
            img:'assets/images/hard_delete.png',
            fun:function(){
            alert('It will delete permanently');
            }
  	    }]

  	}];


//Calling context menu
 $('#testButton2').contextMenu(menu2);
/*Second Example Ends */

/*Third example start*/
$('#testButton3').contextMenu('#popupMenu');
$('.popupClose').click(function(e) {
   $('#testButton3').contextMenu('close');
});
$('.popMenuDoc').click(function(e) {
    document.location="#popMenuDoc";
});

/*Third example End*/

/*Forth example start  */
var menu = [{
  	    name: 'create',
  	    img: 'assets/images/create.png',
  	    title: 'create button',
        disable:true,
 	    fun: function () {
  	        alert('i am add button')
  	    }
  	}, {
  	    name: 'update',
  	    img: 'assets/images/update.png',
  	    title: 'update button',
  	    subMenu: [{
  	        name: 'merge',
  	        title: 'It will merge row',
            img:'assets/images/merge.png',
  	        fun: function () {
  	            alert('It will merge row')
  	        }
  	    }, {
  	        name: 'replace',
  	        title: 'It will replace row',
            img:'assets/images/replace.png',
            disable:true,
            subMenu: [{
  	            name: 'replace top 100',
                img:'assets/images/top.png',
                fun:function(){
                alert('It will replace top 100 rows');
                }

  	        }, {
  	            name: 'replace all',
                img:'assets/images/all.png',
                fun:function(){
                alert('It will replace all rows');
                }
  	        }]
  	    }]
  	}, {
  	    name: 'delete',
  	    img: 'assets/images/delete.png',
  	    title: 'create button',
  	    subMenu: [{
  	        'name': 'soft delete',
            img:'assets/images/soft_delete.png',
            fun:function(){
            alert('You can recover back');
            }
  	    }, {
  	        'name': 'hard delete',
            img:'assets/images/hard_delete.png',
            fun:function(){
            alert('It will delete permanently');
            }
  	    }]

  	}];
$('#testButton4').contextMenu(menu);

$('#enableOption').click(function(e) {
  var updateObj= [{
  	    name: 'create',
        disable:false
  	}, {
  	    name: 'update',
  	    subMenu: [
		 {
  	        name: 'replace',
            disable:false
  	    }]
  	}];
  $('#testButton4').contextMenu('update',updateObj);
  
});
$('#disableOption').click(function(e) {
  var updateObj= [{
  	    name: 'create',
        disable:true
  	}, {
  	    name: 'update',
  	    subMenu: [
		 {
  	        name: 'replace',
            disable:true
  	    }]
  	}];
  $('#testButton4').contextMenu('update',updateObj);
  
});


/*Forth example end */

/*Fifth example start */ 
$('#override').click(function(e) {
    var elm=$(this);
	if(!elm.hasClass('revert')){
		elm.attr('value','Revert').addClass('revert');
		$('body').contextMenu(menu2,{triggerOn:'contextmenu'});
		setTimeout(function(){elm.click()},20000);
		}
	else{
		elm.attr('value','Override Browser Menu').removeClass('revert');
		$('body').contextMenu('destroy');
		}	
});
/*Fifth example start */ 

/*Sixth example start*/
var validator={
		//to check required parameter
		required:function(str){
			return str==""?false:true;
			},
		//to check special character is present in a string
		sCharPresent:function(str){
			var iChars=/(?=.*[!@#$%^&*\"\[\]\^\\])/;
				 return iChars.test(str);
			},
		//to check if string contain number
		numPresent:function(str){
			var iChars=/(?=.*[0-9])/;
				  return iChars.test(str);
			},
		
		//to check min charact
		checkMinChar:function(str,ln){
			return str.length<ln?false:true;
			},
			
		// validation common task
		comnTask:function(elm,correct){
			}		
			
	}

	$('#name').bind('keyup blur',function(e) {
        var elm=$(this),
			str=elm.val(),
			valTipLi=elm.siblings('.valTip').find('li'),
			sChar=validator.sCharPresent(str),
			req=validator.required(str),
			correct=true;
		
		valTipLi.addClass('correct');
		if(sChar){
			valTipLi.filter('.charNotAlwd').removeClass('correct');
			correct=false;
			}
		if(!req){
			correct=false;
			}
		validator.comnTask(elm,correct);	
	
    });
	$('#username').bind('keyup blur',function(e) {
        var elm=$(this),
			str=elm.val(),
			valTipLi=elm.siblings('.valTip').find('li'),
			sChar=validator.sCharPresent(str),
			minChar=validator.checkMinChar(str,6),
			req=validator.required(str),
			correct=true;
		
		valTipLi.addClass('correct');
		if(sChar){
			valTipLi.filter('.charNotAlwd').removeClass('correct');
			correct=false;
			}
		if(!req){
			correct=false;
			}
		if(!minChar){
			valTipLi.filter('.minChar').removeClass('correct');
			correct=false;
			}	
		validator.comnTask(elm,correct);	
    });
	$('#password').bind('keyup blur',function(e) {
        var elm=$(this),
			str=elm.val(),
			valTipLi=elm.siblings('.valTip').find('li'),
			sChar=validator.sCharPresent(str),
			minChar=validator.checkMinChar(str,6),
			numPrsnt=validator.numPresent(str),
			req=validator.required(str),
			correct=true;
		
		valTipLi.addClass('correct');
		if(!sChar){
			valTipLi.filter('.mustSChar').removeClass('correct');
			correct=false;
			}
		if(!req){
			correct=false;
			}
		if(!minChar){
			valTipLi.filter('.minChar').removeClass('correct');
			correct=false;
			}
		if(!numPrsnt){
			valTipLi.filter('.mustNum').removeClass('correct');
			correct=false;
			}
		validator.comnTask(elm,correct);	
    });

	
	$('.validate').each(function() {
       	elm=$(this);
		elm.contextMenu(elm.siblings('.valTip'),{
			'triggerOn':'focusin',
			'displayAround':'trigger'
			});
 
    });
	$('.validate').focusout(function(e) {
        $(this).siblings('.valTip').css('display','none');
    });


/*Sixth example end*/

/*Seventh example start */
var modalSetting={
	top:'50%',
	left:'50%',
	winEventClose:false,
	afterOpen:function(data,e){
		var menu=data.menu,
			menuWidth=menu.innerWidth(),
			menuHeight=menu.innerHeight();
			
			menu.css({
				'margin-left':-(menuWidth/2)+'px',
				'margin-top':-(menuHeight/2)+'px'
				});
			
			$('#overlayDiv').show();	
		},
	onClose:function(data,e){
		var menu=data.menu;			
			menu.css({
				'margin-left':'',
				'margin-top':''
				});
			
			$('#overlayDiv').hide();			
		}	
};

$('#openModal').contextMenu('#modalBox',modalSetting);

/*Seventh example end */

/*eighth example start */
$('div,span,img,a').filter(function () {
    return this.title != '';
}).each(function (index, element) {
    var title = this.title,
        titleId = parseInt(Math.random() * 100000),
        tiltleDiv = $('<div class="titleDiv" style="display:none" titleId="' + titleId + '">' + title + '</div>');

    $('#tipContainer').append(tiltleDiv);
    $(this).attr({
        'title': '',
        'original-title': title,
        'titleId': titleId
    }).contextMenu(tiltleDiv, {
        triggerOn: 'hover',
        displayAround: 'trigger',
        sizeStyle: 'content',
        position: 'bottom'
    });
});
/*eighth example end */


/*Ninth example start */
var menuTrgr=$('#menuTrigger');
menuTrgr.contextMenu('menu','#demoMenu',{
	displayAround:'trigger',
	horAdjust:menuTrgr.width(),
	position:'left'
	})


/*Ninth example End */

/*Tenth example start */
var contextMenuSettings={
	method:'menu',
	option:{
			triggerOn: 'click', 
			displayAround: 'cursor',
			mouseClick: 'left',
			verAdjust: 0,
			horAdjust: 0,
			top:'auto',
			left:'auto',
			sizeStyle:'auto', 
			position: 'auto',
			containment:window 
		}
	}

    $('#trigger').draggable({
			'containment':'#container'
		});
	
		
	//to save options
	$('#trigger').contextMenu(contextMenuSettings.method,menu2,contextMenuSettings.option);
	$('#saveOption').click(function(e) {
        var stng=contextMenuSettings;

		//to set option
		stng.option.triggerOn=$('#triggerOn').val();
		stng.option.displayAround=$('#displayAround').val();
		stng.option.mouseClick=$('#mouseClick').val();
		stng.option.sizeStyle=$('#sizeStyle').val();
		stng.option.position=$('#position').val();
		stng.option.verAdjust=parseInt($('#verAdjust').val());
		stng.option.horAdjust=parseInt($('#horAdjust').val());
		stng.option.top=$('#top').val();
		stng.option.left=$('#left').val();
		if($('#containement').val()!='window'){
			stng.option.containment=$('#containement').val();
			}
		else{
			stng.option.containment=window;
			}	
		
		$('#trigger').contextMenu('destroy');
		$('#trigger').contextMenu(stng.method,menu2,stng.option);
		
    });
	
		

/*Tenth example end*/

});;