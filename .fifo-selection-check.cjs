const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('src/app/admin/(finance)/settlements/new/page.jsx','utf8');
const code=source.match(/const selectFIFO = \(\) => \{([\s\S]*?)\n  \};/)[1];
function run(target,amounts){let selected,error;const orders=amounts.map((amount,i)=>({orderNO:String(i),dateAdded:`2026-01-0${i+1}`,remittanceAmount:amount}));vm.runInNewContext("(() => {" + code + "})()",{targetAmount:String(target),orders,notify:{error:m=>error=m},money:n=>String(n),setSelectedOrderNOs:v=>selected=v,setSelectionMessage:()=>{}});return {selected:Array.from(selected||[]),error};}
assert.deepEqual(run(30,[10,20,40]).selected,['0','1']);
assert.deepEqual(run(25,[10,20,5]).selected,['0']);
assert.deepEqual(run(5,[10,2]).selected,[]);
assert.deepEqual(run(.3,[.1,.2]).selected,['0','1']);
assert.deepEqual(run(25,[20,-5,10]).selected,['0','1','2']);
assert.ok(run(-1,[10]).error);
console.log('FIFO exact, inexact, no-fit, cents, returns and invalid-input checks passed.');

