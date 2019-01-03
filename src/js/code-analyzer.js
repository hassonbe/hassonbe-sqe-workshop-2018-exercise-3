import * as esprima from 'esprima';
let dict =  new Map();
let lValue = false;
let givenParams = undefined;
let ParsedParams = [];
//the Graph stuff
let currentStateType='';
let stateNumber=1;
let currentState='';
let edges = '' ;
let lastReturn= false;
let currentmerge = '';
let feasible= true;
let finished = false;

// change all the /n to <br>
/*function flatten(arr) {
    return arr.reduce(function (flat, toFlatten) {
        return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
    }, []);
}*/
function parseBinaryExpression(expr) {
    let right = typeof parseExpr(expr.right) ==='string' ? parseExpr(expr.right) :JSON.stringify (parseExpr(expr.right));
    let left =   typeof parseExpr(expr.left) ==='string' ? parseExpr(expr.left) :JSON.stringify (parseExpr(expr.left));
    let operator =  expr.operator;
    let result ;
    if(operator === '*' || operator === '/')//|| operator === '<'|| operator === '>'|| operator === '&&'|| operator === '||'|| operator === '==='|| operator === '=='){
    {
        result = '('+left.concat(' ',operator,' ',right,')');

    }
    else{
        result =left.concat(' ',operator,' ',right);
    }
    return result;
}
function parseParams (expr){
    return expr.name;
}

function setGivenParams(){
    let i =0;
    if(givenParams.length >0) {
        for (const param of ParsedParams) {
            dict.set(param, givenParams[i]);
            i++;
        }
    }
}

function parseFunction(parsed) {
    //need to delete all params from dict
    let params = parsed.params.map(parseParams);
    ParsedParams = params;
    // clear global trash
    currentState='';
    currentStateType='';
    let body =parseExpr(parsed.body);
    let subedFunc = body;
    return subedFunc;
}

/*function parseLoc(loc){
    return (loc.start.line);
}*/
function parseUnaryExpression(expr){
    return expr.operator+parseExpr(expr.argument);
}

function endOp() {
    let result=currentState;
    if(feasible&&result!==''&&result.indexOf('feasible')===-1){
        result=result+'|feasible';
    }
    currentState='';
    currentStateType='';
    return result;
}

function parseReturn(retExpr) {
    let result='';
    if(currentStateType=='op'){
        result =endOp();
        edges= edges+'\n'+'state'+(stateNumber-1)+'->state'+stateNumber;
    }
    lValue=true;
    result =result+ makeNode('state'+stateNumber,'operation',' ('+stateNumber+')'+'\nreturn '+parseExpr(retExpr.argument));
    lValue= false;
    stateNumber++;
    lastReturn=true;
    if(feasible){
        finished=true;
    }
    return result;
    //return{line:parseLoc(retExpr.loc),type:'return statement',name:'',condition:'',value:parseExpr(retExpr.argument)};
}

function parseMember(expr) {
    return parseExpr(expr.object)+'['+parseExpr(expr.property)+']';
}

function parseIdentifier(expr) {
    if(!lValue) {
        return symbolicSubAll(expr.name);
    }
    else{
        return expr.name;
    }
}

function parseLiteral(expr) {
    return expr.value;
}

function parseExprStatement(expr) {
    return parseExpr(expr.expression);
}
function parseVarDeclarator(expr) {
    let value = expr.init == null||undefined ?'': parseExpr(expr.init);
    if(value !== ''){
        let left =  expr.id.name;
        if (currentStateType ==='op'){
            currentState = currentState +'\n '+left +' = '+value;
        }
        else{
            currentStateType='op';
            currentState='\nstate'+stateNumber+'=>operation: '+'('+ stateNumber+')\n '+left +' = '+value;// the first /n maybe produce problems
            stateNumber++;
        }
    }
    let name =parseExpr(expr.id);
    dict.set(name,symbolicSubAll(value));
}
function parseBlock(expr) {
    return expr.body.map(parseExpr).join(' ');
}

/*function parseFor(expr) {
    let body = parseExpr(expr.body);
    let test =parseExpr(expr.test);
    let init = parseExpr(expr.init);
    let update = parseExpr(expr.update);
    return [{line:parseLoc(expr.loc),type:'for statement',name:'',condition:test,value:''}].concat(init,update,body);
}*/

function parseUpdate(expr) {
    lValue=true;
    let name = parseExpr(expr.argument);
    lValue = false;
    let pvalue =  parseExpr(expr.argument);
    let add = expr.operator==='++'?'+1':'-1';
    dict.set(name,symbolicSubAll(pvalue)+add);
    if (currentStateType ==='op'){
        currentState = currentState +'\n '+name +expr.operator;
    }
    else{
        currentStateType='op';
        currentState='\nstate'+stateNumber+'=>operation: '+'('+ stateNumber+')\n '+name +expr.operator;
        stateNumber++;
    }
}

function parseLogicalExpr(expr) {
    let right = typeof parseExpr(expr.right) ==='string' ? parseExpr(expr.right) :JSON.stringify (parseExpr(expr.right));
    let left =   typeof parseExpr(expr.left) ==='string' ? parseExpr(expr.left) :JSON.stringify (parseExpr(expr.left));
    let operator =  expr.operator;
    return '('+left.concat(' ',operator,' ',right,')');
}

function cont3(expr) {
    return expr.type === 'BlockStatement' ? parseBlock(expr):
        expr.type === 'LogicalExpression' ? parseLogicalExpr(expr):
            parseUpdate(expr);
    // expr.type === 'UpdateExpression' ? parseUpdate(expr);//: MAY BRING HELL
    // Error('unrecognized expression: '+expr.type);
}

function parseExpr(expr) {
    let cont2 = (expr)=>
        expr.type === 'Literal' ? parseLiteral(expr):
            expr.type === 'MemberExpression' ? parseMember(expr):
                expr.type === 'AssignmentExpression' ? parseAssignment(expr):
                    expr.type === 'FunctionDeclaration' ? parseFunction(expr) :
                        cont3(expr);
    let cont1 = (expr)=>
        expr.type === 'ReturnStatement' ? parseReturn(expr):
            expr.type === 'BinaryExpression' ? parseBinaryExpression(expr):
                expr.type === 'UnaryExpression' ?parseUnaryExpression(expr):
                    expr.type === 'Identifier' ? parseIdentifier(expr):
                        cont2(expr);
    return expr.type === 'VariableDeclaration' ? parseVarDecl(expr) :
        expr.type === 'ExpressionStatement' ? parseExprStatement(expr) :
            expr.type === 'WhileStatement' ? parseWhile(expr) :
                expr.type === 'IfStatement' ? parseIfExp(expr,'null') :
                    cont1(expr);
}
function parseVarDecl(varDec) {
    varDec.declarations.map(parseVarDeclarator);
}
function parseAssignment(expr) {
    let Pvalue = parseExpr(expr.right);
    lValue=true;
    let value = parseExpr(expr.right);
    let left =parseExpr(expr.left);
    lValue=false;
    dict.set(left,symbolicSubAll(Pvalue));// may be not always required
    if (currentStateType ==='op'){
        currentState = currentState +'\n '+left +' = '+value;
    }
    else{
        currentStateType='op';
        currentState='\nstate'+stateNumber+'=>operation: ('+ stateNumber+')\n '+left +' = '+value;
        stateNumber++;
    }
}
function closeOp(){
    let result='';
    if(currentStateType==='op') {
        result = endOp();
        edges=edges+makeEdge('state'+(stateNumber-1),'state'+stateNumber);
    }
    return result;
}
function decideWhileFeas(lastFeas,testRes)
{
    if (!testRes&&lastFeas)
    {
        feasible=true;
    }
}

function testWhile(test) {
    let savedDict =new Map(dict);
    setGivenParams();
    let testres= parseExpr(test);
    testres=evalTest(testres);
    dict=savedDict;
    return testres;
}

function parseWhile(expr) {
    let result = closeOp();
    result=result+makeNode('state'+stateNumber,'operation','('+stateNumber+')\nNull');
    let mergeNumba=stateNumber;
    let lastFeas=feasible;
    stateNumber++;let condNumber= stateNumber;
    edges= edges+makeEdge('state'+(stateNumber-1),'state'+stateNumber);
    result= result+makeNode('state'+stateNumber,'condition','('+stateNumber+')\n'+parseExpr(expr.test));
    let testRes=testWhile (expr.test);
    changeFeas(lastFeas,testRes);stateNumber++;
    edges = edges+makeEdge('state'+(stateNumber-1)+'(yes)','state'+stateNumber);
    let body = parseExpr(expr.body);
    if(currentStateType==='op') {
        result =result+ endOp();
        edges=edges+'\nstate'+(stateNumber-1)+'->state'+mergeNumba;
    }
    decideWhileFeas(lastFeas,testRes); // missed a case where there is a return in the while
    edges= edges+makeEdge('state'+(condNumber)+'(no)','state'+stateNumber);
    return result+body;
}

function evalTest(test) {
    try {
        return eval(test);
    }
    catch (e) {
        return  false;
    }
}

function getCondNode(test,isAlternate) {
    let result='';
    if(isAlternate==='elseIf'){
        result =makeNode('state'+stateNumber,'condition', '('+stateNumber+')\n'+test);
    }
    else{
        currentmerge='mg'+stateNumber;
        result = makeNode('state'+stateNumber,'condition',' ('+stateNumber+')\n'+test)+makeNode('mg'+stateNumber,'end',' + ');
    }
    return result;
}

function getConsequent(consequent,savedDict,stateNum) {
    lastReturn=false;
    let prevMerge =currentmerge;
    let result = parseExpr(consequent);
    edges=lastReturn?edges+'\n'+'state'+stateNum+'(yes)->'+'state'+(stateNum+1):edges+'\nstate'+(stateNumber-1)+'->'+prevMerge+'\n'+'state'+stateNum+'(yes)->'+'state'+(stateNum+1);
    dict = savedDict;
    lastReturn=false;
    if(currentStateType==='op') {
        result = result+endOp();
    }
    return result;
}

function getAlternate(alternate,savedDict,isAlternate,stateNum) {
    let lastNum = stateNumber;
    let result = alter(alternate);
    if(alternate===null){
        edges=edges+makeEdge('state'+stateNum+'(no)','mg'+stateNum);
    }
    if(lastNum!=stateNumber){
        edges=lastReturn?edges+'\n'+'state'+stateNum+'(no)->'+'state'+lastNum:edges+'\nstate'+(stateNumber-1)+'->'+currentmerge+'\n'+'state'+stateNum+'(no)->'+'state'+lastNum;
    }
    lastReturn=false;
    dict=savedDict;
    if(isAlternate!=='elseIf'){
        edges=edges+'\nmg'+stateNum+'->state'+stateNumber;
    }
    return result;
}
function changeFeas(lastFeas,testRes){
    if(lastFeas){
        feasible=testRes;
    }

}

function checkIffinished(lastFeas) {
    if(!finished){
        feasible=lastFeas;
    }
}

function parseIfExp(expr,isAlternate) {
    let savedDict =new Map(dict);
    let result=closeOp();
    let stateNum=stateNumber;
    let lastFeas=feasible;
    setGivenParams();
    let test =parseExpr(expr.test);
    dict = savedDict;
    result= result+getCondNode(test,isAlternate);
    let testRes=evalTest(test);
    changeFeas(lastFeas,testRes);
    stateNumber++;
    let consequent = getConsequent(expr.consequent,savedDict,stateNum);
    changeFeas(lastFeas,!testRes);
    let alternate =getAlternate(expr.alternate,savedDict,isAlternate,stateNum);
    result = result+consequent+endOp()+alternate;
    currentStateType='';
    checkIffinished(lastFeas);
    return result;
}
function makeNode(name,type,value){
    let added = (feasible&&!finished) ? '|feasible':'';
    return '\n'+name+'=>'+type+': '+value+added;
}
function makeEdge(from,to){
    return '\n'+from+'->'+to;
}
function alter (alternate){
    return alternate===null ? '':alternate.type ==='IfStatement' ? parseIfExp(alternate,'elseIf'):parseExpr(alternate);
}

function setUp() {
    dict =  new Map();
    lValue = false;
    givenParams = undefined;
    ParsedParams = [];
    //the Graph stuff
    currentStateType='';
    stateNumber=1;
    currentState='';
    edges = '' ;
    lastReturn= false;
    currentmerge = '';
    feasible= true;
    finished = false;
}

const parseCode = (codeToParse,params) => {
    setUp();
    givenParams = JSON.parse('['+params+']');
    let parsed = esprima.parseScript(codeToParse,{loc: true});
    dict= new Map();
    let result =(parsed.body.map(parseExpr)).filter(function (element) {//was flattened once
        return element != null;
    })[0];
    dict= new Map();
    let return1 =  result;// === undefined ?  [] : result;
    /*if(return1.substring(0,1)==='\n'){ was useful once
        return1 = return1.substring(1);
    }*/
    return return1+edges;
};

function symbolicSub(expr, variable, value) {
    let re = new RegExp('[^A-z]'+variable+'[^A-z]','g');
    let modifyied = (' ' + expr + ' ').replace(re, ' ' + value + ' ');
    if (Array.isArray(dict.get(variable) )) {
        modifyied = (' ' + expr + ' ').replace(re, ' ' + JSON.stringify(value) + ' ');
    }
    return modifyied.substring(1,modifyied.length-1);

}

function symbolicSubAll(value) {
    let result = value;
    for ( const k of dict.keys() ){
        result = symbolicSub(result,k,dict.get(k));
    }
    return result;
}

export {parseCode};

