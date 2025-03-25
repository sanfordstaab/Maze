# Coding Guidelines for client side websites

No libraries
No typescript
No Nodejs
Use ES6 modules

## Hungarian rules
booleans start with f
strings start with s
objects start with o
arrays start with a
numbers may start with n or nothing
types can combine.  for example, an array of arrays of objects
would start with aao

Async functions start with as_
Event handlers start with eh_
Async Event handlers start with as_eh_

Where a series of functions that are closely related exists, 
place them into a static class.

Set all event handlers using the installEventListenerRows function
from client\eventExt.js 