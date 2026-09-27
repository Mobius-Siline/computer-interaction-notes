/* Geometry helper for the real-browser iframe audit; unit tests only check its logic. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.NOTE_LAYOUT_GEOMETRY=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function clippedByAncestor(element,styleOf){
    let rect=element.getBoundingClientRect();
    if(!rect.width||!rect.height)return false;
    for(let parent=element.parentElement;parent;parent=parent.parentElement){
      const style=styleOf(parent),box=parent.getBoundingClientRect();
      if(['hidden','clip'].includes(style.overflowX)
        &&(rect.right>box.right+3||rect.left<box.left-3))return true;
      // Local horizontal scrolling is legitimate. Continue checking its viewport:
      // a scroll container can itself be clipped by an outer container.
      if(['auto','scroll'].includes(style.overflowX))rect=box;
    }
    return false;
  }
  return {clippedByAncestor};
});
