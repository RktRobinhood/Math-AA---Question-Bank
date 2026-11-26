"use strict";
window.CT28Tape=Object.freeze({
 // Editorial rehearsal speech boundaries in seconds; never offered as measured audio.
 cuts:[0,6,12,19,27,33,39,44],
 beats:[
  {title:"Open the spreadsheet",tip:"Use Lists & Spreadsheet to keep values and counts side by side.",caption:"To record laps for a group, start a new Lists & Spreadsheet page.",hold:5,groups:[["Open sheet",3]],keys:["home","1","4"]},
  {title:"Name column A",tip:"Tab to the name cell. Leave the = formula row empty.",caption:"Name column A in its top name cell. Leave the formula row blank and go to numbered row one.",hold:7,groups:[["Select A name",1],["Name lap",4],["Move to A1",1]],keys:["tab","l","a","p","enter","tab"]},
  {title:"Enter the lap values",tip:"Enter stores a value and moves down: 2, 4, 7.",caption:"Enter the measured values down column A. Enter stores each value and moves down.",hold:7,groups:[["Store 2",2],["Store 4",2],["Store 7",2]],keys:["2","enter","4","enter","7","enter"]},
  {title:"Pair each value with its count",tip:"Keep each count beside its value so rows still match.",caption:"Name column B separately. Enter the counts on the same numbered rows as the values.",hold:10,groups:[["Select B name",2],["Name freq",5],["Move to B1",1],["Store count 3",2]],keys:["tab","right","f","r","e","q","enter","tab","3","enter"]},
  {title:"Enter zero, not a blank",tip:"0 means nobody ran four laps. A blank is not a recorded count.",caption:"A count of zero is data. Do not leave that cell blank.",hold:6,groups:[["Store zero",2],["Store count 2",2],["Verify B2",2]],keys:["0","enter","2","enter","up","up"]},
  {title:"Read across, then down",tip:"7 laps belongs with 2 people. Total people: 3 + 0 + 2 = 5.",caption:"Read across a row: the measured value seven occurred twice. Read down the counts for the total.",hold:6,groups:[["Verify B3",1]],keys:["down"]},
  {title:"Raw readings: keep repeats",tip:"One row per person: 2, 2, 2, 7, 7. No frequency column.",caption:"If you start from raw readings instead, give the list one name and enter every observation, including repeats.",hold:19,groups:[["New sheet",3],["Select A name",1],["Name raw",4],["Move to A1",1],["Store three 2s",6],["Store two 7s",4],["Show five rows",1]],keys:["ctrl","doc","4","tab","r","a","w","enter","tab","2","enter","2","enter","2","enter","7","enter","7","enter","up"]}
 ],
 names:{home:"Home",tab:"Tab",enter:"Enter",right:"→",up:"↑",down:"↓",ctrl:"Ctrl",doc:"Doc"}
});
