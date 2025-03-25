// eventExt.js
// requires ge();
// requires utils.js - ge() & applyIdOrElOrArrayToFunction()

var _rows = [];                                    

// call this to queue up an event handler to install
function addEventListenerRow(
                            id, // an id or a DOM element or an array of ids or elements to observe
                            eventName, // the name (or an array of names) of the event (no 'On' preceeding it!)
                            fnEventHandler // event handler function
                            ) {
  _rows.push( [id, eventName, fnEventHandler] );
};

// call this to install all queued event handlers
function installEventListenerRows(rows) {
  if (rows) {
    _rows = rows;
  }
  _rows.forEach(
    (row) => {
      myAddEventListener(row[0], { eventName: row[1], fnEventHandler: row[2] });
    }
  );
}

// call this to install some event handlers
function myAddEventListener(
  idOrElOrArray,        // an id or a DOM element or an array of ids or elements to observe
  o // o.eventName      // the name (or an array of names) of the event (no 'On' preceeding it!)
    // o.fnEventHandler // event handler (or an array of event handler functions) function
  ) {
  if (Array.isArray(idOrElOrArray) || typeof(idOrElOrArray) == 'string') {
    return applyIdOrElOrArrayToFunction(idOrElOrArray, myAddEventListener, o);
  }

  const el = idOrElOrArray;

  if (Array.isArray(o.eventName)) {    
    o.eventName.forEach(
      (eventName) => {
        myAddEventListener(el, { eventName: eventName, fnEventHandler: o.fnEventHandler });
      }
    )
    return;
  }    

  if (Array.isArray(o.fnEventHandler)) {
    o.fnEventHandler.forEach (
      (fnEventHandler) => {
        myAddEventListener(el, { eventName: o.eventName, fnEventHandler: fnEventHandler });
      }
    );
    return;
  }

  if (el.addEventListener) {
    return el.addEventListener(o.eventName, o.fnEventHandler, false);
  } else {
    // older event handler attach method
    return el.attachEvent('on' + o.eventName, o.fnEventHandler);
  }
};

function myRemoveEventListener(
  idOrElOrArray, // an id or a DOM element or a nested array of them
  o // eventName, // the name of the event (no On preceeding it!)
    // fnEventHandler // event handler to remove
  ) {
  if (Array.isArray(idOrElOrArray) || typeof(idOrElOrArray) == 'string') {
    return applyIdOrElOrArrayToFunction(idOrElOrArray, myRemoveEventListener, o);
  }

  const el = idOrElOrArray;

  if (Array.isArray(o.eventName)) {    // its an array of event names
    o.eventName.forEach(
      (eventName) => {
        myRemoveEventListener(el, { eventName: eventName, eventListener: o.fnEventHandler });
      }
    )
    return;
  }

  if (el.removeEventListener) {
    el.removeEventListener(o.eventName, o.fnEventHandler);
  } else {
    el.detachEvent('on' + o.eventName, o.fnEventHandler);
  }
};

function fireMouseClickEvent(idTarget) {
  // handy for simulating mouse clicks
  var eTarget = ge(idTarget);
  if (document.createEventObject) {   // IE before version 9
    var clickEvent = document.createEventObject(window.event);
    clickEvent.button = 1;  // left click
    eTarget.fireEvent ('onclick', clickEvent);
  } else {
    var mouseEvent = document.MouseEvent ("click", {
      screenX : 0, 
      screenY : 0, 
      clientX : 0, 
      clientY : 0, 
      ctrlKey : false, 
      altKey : false, 
      shiftKey : false, 
      metaKey : false,
      button : 0, 
      buttons : 1,
      relatedTarget : eTarget
    });
    eTarget.dispatchEvent(mouseEvent);
  }
}
