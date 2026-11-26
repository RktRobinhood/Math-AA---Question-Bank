(function(root){
'use strict';
const T=root.CT08Tape;
// MP3 slice boundaries sit inside measured silence. Visual action groups
// are separate from the spoken script and replay from the original LCD tape.
const clip=[[0,3.80,14],[3.80,7.22,8],[7.22,11.20,8],[11.20,14.88,23],[14.88,17.86,6],[17.86,21.98,5],[21.98,25.10,5]];
const groups=[
 ['Plot the function',0,10],
 ['Spot the missing vertex',10,10],
 ['Open Window Settings',10,13],
 ['Set both axis ranges',13,25],
 ['Apply the window',25,26],
 ['Check the new view',26,26]
];
const chapterFor=[0,1,2,3,4,5,5];
function note(p,n){
 switch(p.span.i){
  case 0:return n<7?'Type (x − 12), then use x² to square the whole bracket.':'Finish with + 3 and press Enter to plot.';
  case 1:return p.fraction<.56||p.speaking?'The screen is blank. Before retyping anything, check the x-axis: the default view ends at 10.':'The vertex is at x = 12, outside that view. A blank screen does not mean the function is wrong.';
  case 2:return n<11?'Press Menu. Window settings controls what part of the graph you see.':n<12?'Choose 4: Window/Zoom.':'Choose 1: Window Settings. The dialog has a minimum, maximum and scale for each axis.';
  case 3:
   if(n<16)return 'The default x-range missed 12. Enter 10 for XMin, then press Tab to reach XMax.';
   if(n<19)return 'Enter 14 for XMax. The x-range 10 to 14 gives equal space on both sides of 12.';
   if(n<20)return 'Leave XScale on Auto, so the calculator chooses the tick spacing. Tab to YMin.';
   if(n<22)return 'The vertex is above y = 0. Set YMin to 0 to leave room below it, then Tab to YMax.';
   if(n<24)return 'At x = 10 and x = 14 the graph is at y = 7. Set YMax to 8 so both arms fit.';
   return 'Leave YScale on Auto. Tab to OK.';
  case 4:return n<26?'When OK is highlighted, press Enter. Think of this as moving the camera, not changing the function.':'The function is still defined for every real x. The new screen only shows x from 10 to 14.';
  case 5:return p.speaking||p.fraction<.42?'Before: the screen ended at x = 10, so the vertex at x = 12 was off-screen.':'After: x from 10 to 14 and y from 0 to 8 show the vertex (12, 3) and both arms.';
  default:return 'For your question, choose x-bounds around the feature and y-bounds that leave room above and below.';
 }
}
const make=multiplier=>root.TeachingHolds.make(clip,multiplier);
function frame(p){
 const chapter=chapterFor[p.span.i], [,from,to]=groups[chapter];
 const count=to-from, fraction=p.fraction;
 // Every press has its own interval, separated by a short unlit gap.
 const tail=p.span.i===3?.92:.87;
 const sweep=p.speaking||!count?0:Math.max(0,Math.min(count,(fraction-.08)*count/(tail-.08)));
 const applied=from+Math.min(count,Math.floor(sweep+1e-8));
 let key='';
 // At the end of the statement, a key changes the calculator and then remains lit.
 if(!p.speaking&&applied>from&&(sweep-applied+from)<.80&&fraction<=tail+(tail-.08)*.80/count){
  key=T.keys[applied-1].key;
 }
 return {chapter,applied,key};
}
root.CT08WatchPlan=Object.freeze({clip,groups,chapterFor,make,frame,note});
})(globalThis);
