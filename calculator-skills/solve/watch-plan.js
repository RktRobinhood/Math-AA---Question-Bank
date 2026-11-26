// Original narration cuts, chosen inside measured MP3 silence. The two
// clocks are independent: only the visual action clock moves in the holds.
export const beats = [
 [0,     6.02,  8.2, 0,     6.25],
 [6.02, 10.43, 13.5, 6.25, 10.62],
 [10.43,17.63, 10,  10.62, 17.93],
 [17.63,20.19,  3.6,17.93, 20.52],
 [20.19,23.29,  3.4,20.52, 23.55],
 [23.29,29.14, 18,  23.55, 29.44],
 [29.14,35.42,  5,  29.44, 35.56]
];
export const makeLayout = (holdScale=1) => globalThis.TeachingHolds.make(beats,holdScale);
// Space physical taps evenly within a group. Source cue times can cluster
// tightly (e.g. Del x3); retaining these as real-time gaps makes them illegible.
const windows = beats.map(([,,,from,to]) => [
 from,
 ...globalThis.HandheldKeyCues.CT06.map(event=>event.timeMs/1000).filter(t=>t>from&&t<to),
 to
]);
export function demoTime(point) {
 const marks=windows[point.span.i];
 if(point.speaking)return marks[0];
 const lead=.06, tail=point.span.i===3?.25:.07;
 const step=(marks.length-1)*Math.max(0,Math.min(1,(point.fraction-lead)/(1-lead-tail)));
 const i=Math.min(Math.floor(step),marks.length-2);
 return marks[i]+(marks[i+1]-marks[i])*(step-i);
}
export const keyName = key => ({
 menu:'Menu',power:'^',right:'→',left:'←',up:'↑',equals:'=',plus:'+',comma:',',
 rightParen:')',enter:'Enter',del:'Del',negative:'(−)'
}[key]||key);
