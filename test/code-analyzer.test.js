import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';

describe('The javascript parser', () => {
    it('is parsing an empty function correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('function test (){}','')),
            '""'
        );
    });

    it('is parsing a simple variable declaration correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('function test (){let a = 1;}','')),
            '""'
        );
    });

    it('simple function with one return point', () => {
        assert.equal(
            JSON.stringify(parseCode('function foo (x,y){let a = 1;\n let b = 2 ; \n let c = a +b ; c=c+a ; return c;}','')),
            '"    \\nstate1=>operation: (1)\\n a = 1\\n b = 2\\n c = 1 + 2\\n c = c + a|feasible\\nstate2=>operation:  (2)\\nreturn c|feasible\\nstate1->state2"'
        );
    });

    it('is parsing a simple function correctly with environment variables correct', () => {
        assert.equal(
            JSON.stringify(parseCode('let a = 1;\n let b = 2 ; \nfunction foo (x,y){ let c = a +b ; c=c+a ; return c;}','')),
            '"  \\nstate2=>operation: (2)\\n c = 1 + 2\\n c = c + a|feasible\\nstate3=>operation:  (3)\\nreturn c|feasible\\nstate2->state3"'
        );
    });

    it('parsing first example', () => {
        assert.equal(
            JSON.stringify(parseCode('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    if (b < z) {\n' +
                '        c = c + 5;\n' +
                '    } else if (b < z * 2) {\n' +
                '        c = c + x + 5;\n' +
                '    } else {\n' +
                '        c = c + z + 5;\n' +
                '    }\n' +
                '    \n' +
                '    return c;\n' +
                '}\n','1,2,3')),
            '"   \\nstate1=>operation: (1)\\n a = x + 1\\n b = x + 1 + y\\n c = 0|feasible\\nstate2=>condition:  (2)\\n1 + 1 + 2 < 3|feasible\\nmg2=>end:  + |feasible\\nstate3=>operation: (3)\\n c = c + 5\\nstate4=>condition: (4)\\n1 + 1 + 2 < (3 * 2)|feasible\\nstate5=>operation: (5)\\n c = c + x + 5|feasible\\nstate6=>operation: (6)\\n c = c + z + 5 \\nstate7=>operation:  (7)\\nreturn c|feasible\\nstate1->state2\\nstate3->mg2\\nstate2(yes)->state3\\nstate5->mg2\\nstate4(yes)->state5\\nstate6->mg2\\nstate4(no)->state6\\nstate6->mg2\\nstate2(no)->state4\\nmg2->state7"'

        );
    });

    it('parsing second example', () => {
        assert.equal(
            JSON.stringify(parseCode('function foo(x, y, z){\n' +
                '   let a = x + 1;\n' +
                '   let b = a + y;\n' +
                '   let c = 0;\n' +
                '   \n' +
                '   while (a < z) {\n' +
                '       c = a + b;\n' +
                '       z = c * 2;\n' +
                '       a++;\n' +
                '   }\n' +
                '   \n' +
                '   return z;\n' +
                '}\n','')),
            '"   \\nstate1=>operation: (1)\\n a = x + 1\\n b = x + 1 + y\\n c = 0|feasible\\nstate2=>operation: (2)\\nNull|feasible\\nstate3=>condition: (3)\\nx + 1 < z|feasible\\nstate4=>operation: (4)\\n c = a + b\\n z = (c * 2)\\n a++   \\nstate5=>operation:  (5)\\nreturn z|feasible\\nstate1->state2\\nstate2->state3\\nstate3(yes)->state4\\nstate4->state2\\nstate3(no)->state5"'

        );
    });

    it('second example with params', () => {
        assert.equal(
            JSON.stringify(parseCode('function foo(x, y, z){\n' +
                '   let a = x + 1;\n' +
                '   let b = a + y;\n' +
                '   let c = 0;\n' +
                '   \n' +
                '   while (a < z) {\n' +
                '       c = a + b;\n' +
                '       z = c * 2;\n' +
                '       a++;\n' +
                '   }\n' +
                '   \n' +
                '   return z;\n' +
                '}\n','1,2,1')),
            '"   \\nstate1=>operation: (1)\\n a = x + 1\\n b = x + 1 + y\\n c = 0|feasible\\nstate2=>operation: (2)\\nNull|feasible\\nstate3=>condition: (3)\\nx + 1 < z|feasible\\nstate4=>operation: (4)\\n c = a + b\\n z = (c * 2)\\n a++   \\nstate5=>operation:  (5)\\nreturn z|feasible\\nstate1->state2\\nstate2->state3\\nstate3(yes)->state4\\nstate4->state2\\nstate3(no)->state5"'
        );
    });

    it('my first example with colors', () => {
        assert.equal(
            JSON.stringify(parseCode('function foo(x, y, z){\n' +
                '   let tmp1,tmp2,tmp3;\n' +
                '   let a = -1;\n' +
                '   let b = -3 + y;\n' +
                '   let c = 0;\n' +
                '   \n' +
                '   if(a<0&&b*3>5){\n' +
                '      while(true){\n' +
                '         return false;\n' +
                '     }\n' +
                '    } \n' +
                '   return z;\n' +
                '}\n','')),
            '"    \\nstate1=>operation: (1)\\n a = -1\\n b = -3 + y\\n c = 0|feasible\\nstate2=>condition:  (2)\\n(-1 < 0 && (-3 + y * 3) > 5)|feasible\\nmg2=>end:  + |feasible\\nstate3=>operation: (3)\\nNull\\nstate4=>condition: (4)\\ntrue\\nstate5=>operation:  (5)\\nreturn false \\nstate6=>operation:  (6)\\nreturn z|feasible\\nstate1->state2\\nstate3->state4\\nstate4(yes)->state5\\nstate4(no)->state6\\nstate2(yes)->state3\\nstate2(no)->mg2\\nmg2->state6"'
        );
    });
    it('parsing array expressions , and complex logical exps', () => {
        assert.equal(
            JSON.stringify(parseCode('function foo(x,isEqual,arr){\n' +
                '                    let a;\n' +
                '                    a= x+7;\n' +
                '                    if(isEqual || (arr[3]>2 && (7 <= a))){\n' +
                '                   return a;\n' +
                '                }           \n' +
                '   return arr[3];\n' +
                '                }','3,false,[1,2,3,4,5]')),
            '"  \\nstate1=>operation: (1)\\n a = x + 7|feasible\\nstate2=>condition:  (2)\\n(false || ([1,2,3,4,5][3] > 2 && 7 <= 3 + 7))|feasible\\nmg2=>end:  + |feasible\\nstate3=>operation:  (3)\\nreturn a|feasible \\nstate4=>operation:  (4)\\nreturn arr[3]\\nstate1->state2\\nstate2(yes)->state3\\nstate2(no)->mg2\\nmg2->state4"'
        );
    });

    it('parsing unsupported expressions', () => {
        assert.equal(
            JSON.stringify(parseCode('function foo(x,length,length2){\n' +
                '                                    let a;\n' +
                '                a=x+7;\n' +
                '                while(a>=8 && length>length2 && 8>7 && true != false)   {\n' +
                '                 a--; \n' +
                '                 }\n' +
                '                if(8 && 9){\n' +
                '                   return -1;\n' +
                '                 }\n' +
                '\n' +
                '                if(false){\n' +
                '                return "this will never happen";\n' +
                '                }\n' +
                '                else {\n' +
                '                return -1;\n' +
                '                } \n' +
                '                a=5;\n' +
                '                x=x+9999;\n' +
                '                }','-3,7,5')),
            '"  \\nstate1=>operation: (1)\\n a = x + 7|feasible\\nstate2=>operation: (2)\\nNull|feasible\\nstate3=>condition: (3)\\n(((x + 7 >= 8 && length > length2) && 8 > 7) && true != false)|feasible\\nstate4=>operation: (4)\\n a-- \\nstate5=>condition:  (5)\\n(8 && 9)|feasible\\nmg5=>end:  + |feasible\\nstate6=>operation:  (6)\\nreturn -1|feasible \\nstate7=>condition:  (7)\\nfalse\\nmg7=>end:  + \\nstate8=>operation:  (8)\\nreturn this will never happen\\nstate9=>operation:  (9)\\nreturn -1  \\nstate1->state2\\nstate2->state3\\nstate3(yes)->state4\\nstate4->state2\\nstate3(no)->state5\\nstate5(yes)->state6\\nstate5(no)->mg5\\nmg5->state7\\nstate7(yes)->state8\\nstate7(no)->state9\\nmg7->state10"'

        );
    });
});
