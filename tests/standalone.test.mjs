import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=new URL('../standalone/reim-calculator.html',import.meta.url);
test('offline bundle embeds engine, app and all four presets',()=>{
 const text=readFileSync(file,'utf8');
 assert.ok(text.startsWith('<!doctype html>'));
 for(const name of ['Ansam 1','Ajwan Towers C','DAMAC Heights','Sobha Hartland Waves']) assert.ok(text.includes(name),name);
 assert.ok(!text.includes('<script type="module"'));
 assert.ok(!text.includes('<link rel="stylesheet"'));
 assert.ok(text.includes('function evaluate('));
 assert.ok(text.includes('function buildReport('));
});
