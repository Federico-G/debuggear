@{%
function bnf_join_id(a, b) {
    if (!a.identifiers) {
        if (!b.identifiers) {
            return [];
        } else {
            return b.identifiers;
        }
    } else if (!b.identifiers) {
        return a.identifiers;
    }
    return a.identifiers.concat(b.identifiers.filter(function(item) {
        return a.identifiers.indexOf(item) < 0;
    }))
}

%}
MAIN -> dgIN                                                        {% id %}
    | dgOUT                                                         {% id %}
    | dgOP                                                          {% id %}
    | dgWHILE                                                       {% id %}
    | dgDOWHILE                                                     {% id %}
    | dgFOR                                                         {% id %}
    | dgIF                                                          {% id %}
    | dgFUNCTION                                                    {% id %}


dgIN -> declaratorNoOpt                                             {% d => ({type:'IN', identifiers: d[0].identifiers}) %}
    | declaratorTypeIdentifier                                      {% d => {d[0].type = 'IN'; return d[0]} %}

declaratorNoOpt -> identifier                                       {% d => ({identifiers: [d[0]]}) %}
    | declaratorNoOpt "[" _ conditionalExpression _ "]"             {% d => ({identifiers: d[0].identifiers}) %}


dgOUT -> dgOUT _ "," _ validOUT                                     {% d => ({type:'OUT', identifiers: bnf_join_id(d[0], d[4])}) %}
    | validOUT                                                      {% d => ({type:'OUT', identifiers: d[0].identifiers}) %}

validOUT -> constant                                                {% d => ({identifiers: []}) %}
    | stringLiteral                                                 {% d => ({identifiers: []}) %}
    | identifier                                                    {% d => ({identifiers: [d[0]]}) %}


dgOP -> statements                                                  {% d => ({type:'OP', statements: d[0]}) %}
    | retStatement                                                  {% d => ({type:'OP', statements: d[0]}) %}
    | statements _ retStatement                                     {% d => ({type:'OP', statements: d[0].concat([d[2]])}) %}

dgWHILE -> expression                                               {% d => ({type:'WHILE', identifiers: d[0].identifiers}) %}


dgDOWHILE -> expression                                             {% d => ({type:'DOWHILE', identifiers: d[0].identifiers}) %}


dgFOR -> expression _ ";" _ expression _ ";" _ expression           {% d => ({type:'FOR', identifiers: bnf_join_id({identifiers: bnf_join_id(d[0], d[4])}, d[8])}) %}
    | expression _ ";" _ expression _ ";"                           {% d => ({type:'FOR', identifiers: bnf_join_id(d[0], d[4])}) %}
    | expression _ ";" _ ";" _ expression                           {% d => ({type:'FOR', identifiers: bnf_join_id(d[0], d[6])}) %}
    | ";" _ expression _ ";" _ expression                           {% d => ({type:'FOR', identifiers: bnf_join_id(d[2], d[6])}) %}
    | ";" _ ";" _ expression                                        {% d => ({type:'FOR', identifiers: d[4].identifiers}) %}
    | ";" _ expression _ ";"                                        {% d => ({type:'FOR', identifiers: d[2].identifiers}) %}
    | expression _ ";" _ ";"                                        {% d => ({type:'FOR', identifiers: d[0].identifiers}) %}
    | ";" _ ";"                                                     {% d => ({type:'FOR'}) %}


dgIF -> expression                                                  {% d => ({type:'IF', identifiers: d[0].identifiers}) %}


dgFUNCTION -> typeSpecifier _ identifier _ "(" _ declaratorTypeIdentifierList _ ")" {% d => ({type:'FUNCTION', returnType: d[0], functionName: d[2], parameters: d[6].parameters}) %}
    | typeSpecifier _ identifier _ "(" _ ")"                        {% d => ({type:'FUNCTION', returnType: d[0], functionName: d[2], parameters: []}) %}

declaratorTypeIdentifierList -> declaratorTypeIdentifier            {% d => d[0] %}
    | declaratorTypeIdentifierList _ "," _ declaratorTypeIdentifier {% d => ({parameters: d[4].parameters.concat(d[0].parameters) }) %}

declaratorTypeIdentifier -> declarationTypeSpecifier _ identifier   {% d => ({parameters: [{dataType: d[0], identifier: d[2]}] }) %}





retStatement -> "return" _ ";"                                      {% d => ({type: "return" }) %}
    | "return" _  expression _ ";"                                  {% d => ({type: "return", identifiers: d[2].identifiers }) %}


statements -> statement                                             {% d => [d[0]] %}
    | statements _ statement                                        {% d => d[0].concat([d[2]]) %}

statement -> expressionStatement                                    {% d => d[0] %}
    | declaration                                                   {% d => d[0] %}


expressionStatement -> expression _ ";"                             {% d => d[0] %}
    | ";"                                                           {% d => null %}

declaration -> declarationTypeSpecifier _ initDeclarators _ ";"     {% d => ({type: "declaration", declarationType: d[0], declarators: d[2].declarators}) %}


initDeclarators -> initDeclarator                                   {% d => d[0] %}
    | initDeclarators _ "," _ initDeclarator                        {% d => ({declarators: d[4].declarators.concat(d[0].declarators)}) %}

initDeclarator -> declarator                                        {% d => d[0] %}
    | declarator _ "=" _ assignmentExpression                       {% d => {var x = {declarators: [{value: ""}]}; x.declarators[0].value = d[0].declarators[0].value; x.declarators[0].identifiers = bnf_join_id(d[0].declarators[0], d[4]); return x} %}

declarator -> identifier                                            {% d => ({declarators: [{value: d[0]}]}) %} # Primero
    | declarator "[" _ conditionalExpression _ "]"                  {% d => { d[0].declarators[0].identifiers = d[3].identifiers; return d[0] } %}
    | declarator "[" _ "]"                                          {% d => d[0] %}






typeSpecifier -> "void"                                             {% d => d[0] %}
    | declarationTypeSpecifier                                      {% d => d[0] %}
declarationTypeSpecifier -> "char"                                  {% d => d[0] %}
    | "short int"                                                   {% d => d[0] %}
    | "int"                                                         {% d => d[0] %}
    | "long int"                                                    {% d => d[0] %}
    | "float"                                                       {% d => d[0] %}
    | "double"                                                      {% d => d[0] %}


expression -> assignmentExpression                                  {% d => ({type: "expression", identifiers: d[0].identifiers }) %}
    | expression _ "," _ assignmentExpression                       {% d => ({type: "expression", identifiers: bnf_join_id(d[0], d[4]) }) %}

assignmentExpression -> conditionalExpression                       {% d => d[0] %}
    | unaryExpression _ assignmentOperator _ assignmentExpression   {% d => ({identifiers: bnf_join_id(d[0], d[4]) }) %}

conditionalExpression -> logicalOrExpression                        {% d => d[0] %}
    | logicalOrExpression _ "?" _ expression _ ":" _ conditionalExpression {% d => ({identifiers: bnf_join_id({identifiers: bnf_join_id(d[0], d[4])}, d[8]) }) %}

logicalOrExpression -> logicalAndExpression                         {% d => d[0] %}
    | logicalOrExpression _ "||" _ logicalAndExpression             {% d => ({identifiers: bnf_join_id(d[0], d[4]) }) %}

logicalAndExpression -> inclusiveOrExpression                       {% d => d[0] %}
    | logicalAndExpression _ "&&" _ inclusiveOrExpression           {% d => ({identifiers: bnf_join_id(d[0], d[4]) }) %}

inclusiveOrExpression -> exclusiveOrExpression                      {% d => d[0] %}
    | inclusiveOrExpression _ "|" _ exclusiveOrExpression           {% d => ({identifiers: bnf_join_id(d[0], d[4]) }) %}

exclusiveOrExpression -> andExpression                              {% d => d[0] %}
    | exclusiveOrExpression _ "^" _ andExpression                   {% d => ({identifiers: bnf_join_id(d[0], d[4]) }) %}

andExpression -> equalityExpression                                 {% d => d[0] %}
    | andExpression _ "&" _ equalityExpression                      {% d => ({identifiers: bnf_join_id(d[0], d[4]) }) %}

equalityExpression -> relationalExpression                          {% d => d[0] %}
    | equalityExpression _ "==" _ relationalExpression              {% d => ({identifiers: bnf_join_id(d[0], d[4]) }) %}
    | equalityExpression _ "!=" _ relationalExpression              {% d => ({identifiers: bnf_join_id(d[0], d[4]) }) %}

relationalExpression -> shiftExpression                             {% d => d[0] %}
    | relationalExpression _ "<" _ shiftExpression                  {% d => ({identifiers: bnf_join_id(d[0], d[4]) }) %}
    | relationalExpression _ ">" _ shiftExpression                  {% d => ({identifiers: bnf_join_id(d[0], d[4]) }) %}
    | relationalExpression _ "<=" _ shiftExpression                 {% d => ({identifiers: bnf_join_id(d[0], d[4]) }) %}
    | relationalExpression _ ">=" _ shiftExpression                 {% d => ({identifiers: bnf_join_id(d[0], d[4]) }) %}

shiftExpression -> additiveExpression                               {% d => d[0] %}
    | shiftExpression _ "<<" _ additiveExpression                   {% d => ({identifiers: bnf_join_id(d[0], d[4]) }) %}
    | shiftExpression _ ">>" _ additiveExpression                   {% d => ({identifiers: bnf_join_id(d[0], d[4]) }) %}

additiveExpression -> multiplicativeExpression                      {% d => d[0] %}
    | additiveExpression _ "+" _ multiplicativeExpression           {% d => ({identifiers: bnf_join_id(d[0], d[4]) }) %}
    | additiveExpression _ "-" _ multiplicativeExpression           {% d => ({identifiers: bnf_join_id(d[0], d[4]) }) %}

multiplicativeExpression -> castExpression                          {% d => d[0] %}
    | multiplicativeExpression _ "*" _ castExpression               {% d => ({identifiers: bnf_join_id(d[0], d[4]) }) %}
    | multiplicativeExpression _ "/" _ castExpression               {% d => ({identifiers: bnf_join_id(d[0], d[4]) }) %}
    | multiplicativeExpression _ "%" _ castExpression               {% d => ({identifiers: bnf_join_id(d[0], d[4]) }) %}

castExpression -> unaryExpression                                   {% d => d[0] %}
    | "(" _ typeSpecifier _ ")" _ unaryExpression                   {% d => d[6] %}

unaryExpression -> postfixExpression                                {% d => d[0] %}
    | "++" _ unaryExpression                                        {% d => d[2] %}
    | "--" _ unaryExpression                                        {% d => d[2] %}
    | unaryOperator _ castExpression                                {% d => ({identifiers: bnf_join_id(d[0], d[2]) }) %}
    | "sizeof" _ unaryExpression                                    {% d => d[2] %}
    | "sizeof" _ "(" _ declarationTypeSpecifier _ ")"

# Change assignmentExpression to expression in ()
postfixExpression-> primaryExpression                               {% d => d[0] %}
    | postfixExpression _ "[" _ expression _ "]"                    {% d => ({identifiers: bnf_join_id(d[0], d[4]) }) %}
    | postfixExpression _ "(" _ expression _ ")"                    {% d => ({identifiers: bnf_join_id(d[0], d[4]) }) %}
    | postfixExpression _ "(" _ ")"                                 {% d => d[0] %}
    | identifier _ "++"                                             {% d => ({identifiers: [d[0]]}) %}
    | identifier _ "--"                                             {% d => ({identifiers: [d[0]]}) %}

primaryExpression -> identifier                                     {% d => ({identifiers: [d[0]]}) %}
    | constant
    | stringLiteral
    | "(" _ expression _ ")"                                        {% d => d[2] %}


identifier -> identifier2                                           {% d => d.flat(Infinity).join("") %}
identifier2 -> identifierNondigit
    | identifier2 identifierNondigit
    | identifier2 digit

identifierNondigit -> nondigit



# CONSTANTS
constant -> constant2                                               {% d => d.flat(Infinity).join("") %}
constant2 -> integerConstant
    | characterConstant
    | floatingConstant

integerConstant -> decimalConstant integerSuffix:? | octalConstant integerSuffix:? | hexadecimalConstant integerSuffix:?
decimalConstant -> nonzeroDigit | decimalConstant digit
octalConstant -> "0" | octalConstant octalDigit
hexadecimalConstant -> hexadecimalPrefix hexadecimalDigit | hexadecimalConstant hexadecimalDigit
hexadecimalPrefix -> "0x" | "0X"
integerSuffix -> unsignedSuffix longSuffix:? |  unsignedSuffix longLongSuffix | longSuffix unsignedSuffix:? | longLongSuffix unsignedSuffix:?
unsignedSuffix -> "u" | "U"
longSuffix -> "l" | "L"
longLongSuffix -> "ll" | "LL"

floatingConstant -> decimalFloatingConstant | hexadecimalFloatingConstant
decimalFloatingConstant -> fractionalConstant exponentPart:? floatingSuffix:? | digitSequence exponentPart floatingSuffix:?
hexadecimalFloatingConstant -> hexadecimalPrefix hexadecimalFractionalConstant binaryExponentPart floatingSuffix:? | hexadecimalPrefix hexadecimalDigitSequence binaryExponentPart floatingSuffix:?
fractionalConstant -> digitSequence:? "." digitSequence | digitSequence "."
exponentPart -> "e" sign:? digitSequence | "E" sign:? digitSequence
sign -> "+" | "-"
digitSequence -> digit | digitSequence digit
hexadecimalFractionalConstant -> hexadecimalDigitSequence:? "." hexadecimalDigitSequence | hexadecimalDigitSequence "."
binaryExponentPart -> "p" sign:? digitSequence | "P" sign:? digitSequence
hexadecimalDigitSequence ->  hexadecimalDigit | hexadecimalDigitSequence hexadecimalDigit
floatingSuffix-> "f" | "l" | "F" | "L"

characterConstant -> "'" cChar "'" | "L'" cChar "'"
cChar -> [^'\\\n\r] | escapeSequence
escapeSequence -> simpleEscapeSequence | octalEscapeSequence | hexadecimalEscapeSequence
simpleEscapeSequence -> "\\'" | "\\\"" | "\\?" | "\\\\" | "\\a" | "\\b" | "\\f" | "\\n" | "\\r" | "\\t" | "\\v"
octalEscapeSequence -> "\\" octalDigit | "\\" octalDigit octalDigit | "\\" octalDigit octalDigit octalDigit
hexadecimalEscapeSequence -> "\\x" hexadecimalDigit | hexadecimalEscapeSequence hexadecimalDigit
# END CONSTANTS

stringLiteral -> stringLiteral2                                     {% d => d.flat(Infinity).join("") %}
stringLiteral2 -> "\"" sCharSequence:? "\"" | "L\"" sCharSequence:? "\""
sCharSequence -> cChar | sCharSequence cChar

assignmentOperator -> "=" | "*=" | "/=" | "%=" | "+=" | "-=" | "<<=" | ">>=" | "&=" | "^=" | "|="
unaryOperator -> "&" | "*" | "+" | "-" | "~" | "!"

nonzeroDigit -> [1-9]
digit -> [0-9]
hexadecimalDigit -> [0-9a-fA-F]
octalDigit -> [0-7]
nondigit -> [a-zA-Z_] 



_ -> [\n\s]:*                                                       {% d => null %}
__ -> [\n\s]:+                                                      {% d => null %}
