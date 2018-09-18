function Parser() {
	const 
		TNUM = 'Numeric',
		TOP  = 'Op',
		  
		POW  = '^',
		FACT = '!',
		ADD  = '+',
		SUB  = '-',
		UMIN = '±',
		MULT = '*',
		DIV  = '/',
		PAR  = '(',
		RPAR = ')',
		SIN  = 'Sin',
		COS  = 'Cos',
		  
		Ops      = [ADD, SUB, MULT, DIV, FACT, UMIN, POW, SIN, COS],
		AllOps   = [ADD, SUB, MULT, DIV, FACT, UMIN, POW, SIN, COS, PAR, RPAR],
		Unar     = [UMIN, FACT, SIN, COS],
		UPrefix  = [UMIN, SIN, COS],
		UPostfix = [FACT],
		WSpaces  = [' ', '\n', '\t'];
	
	var input = '',
		iter = 0,
		prevToken = '', token = '';
	
	this.parse = function (_input) {
		input = _input.trim();					// Если первый символ "-", привести к виду 0-Expr..
		if (input[0] === SUB) input = '0' + input;
		//if (input[0] === SUB) input = UMIN + input.substring(1, input.length);
		
		var rpn = (new toRPN).get(input);
		var res = (new Сalc).calcFromRPN(rpn);
		console.log(input);
		console.log(rpn);
		console.log(res);
		return res;
	}
	function toRPN() {
		this.get = function (input) {
			var
				stack = [],
				out = '';
			do {
				prevToken = (token !== '')? token : '';
				token = getToken();
				
				if (token === '') {				// Если конец строки, либо неизвестный символ
					while (stack.length > 0)
						out += stack.pop() + ' ';
					return out;
				}
				if (isNumeric(token)) {			// Если встретилось число
					out += token + ' ';
					continue;
				}
				if (isOperator(token)) {		// Если встретился оператор
					if (UPostfix.indexOf(token) !== -1)
						out += token + ' ';
					else {
						var 
							ps = prior(stack[stack.length - 1]),
							pt = prior(token)
						;
						if (stack.length === 0 || UPrefix.indexOf(token) !== -1 || (ps && pt && ps < pt)) {
							stack.push(token);
						} else {
							while (stack.length > 0 && (UPrefix.indexOf(stack[stack.length - 1])) !== -1 || (ps && pt && ps >= pt))
								out += stack.pop() + ' ';
							if (stack.length === 0 || ps < pt)
								stack.push(token);
						}
					}
					continue;
				}
				if (token === PAR) {			// Если встретилась открывающая скобка
					stack.push(token);
					continue;
				}
				if (token === RPAR) {			// Если встретилась закрывающая скобка
					while (stack.length > 0 && stack[stack.length - 1] !== PAR)
						out += stack.pop() + ' ';
					stack.pop();
				}
			} while (true);		
		}
	}
	function Сalc() {
		this.calcFromRPN = function (rpn) {
			var iter = 0, operand, a, b, last = 0, cnt = 10,
				stack = [];
				
			while (iter < rpn.length - 1 && --cnt > 0) {
				iter = rpn.indexOf(' ', iter);
				operand = rpn.substring(last, iter);
				if (isNumeric(operand)) {
					stack.push(operand);
				} else {
					if ( Unar.indexOf(operand) === -1 ) {
						b = stack.pop();
						a = stack.pop();
						stack.push(calc(operand, a, b));
					} else {
						a = stack.pop();
						stack.push(calc(operand, a));
					}	// if
				}	// if
				iter++, last = iter;
			}	// while
			return stack[0];
		}	// calcFromRPN
	}
	function getToken() {	// все переписать на регулярки. Все правила
		delWS();
		
		if (iter >= input.length) return '';
		var out = '';
		prevToken = token;
		token = input[iter];
		
		// Число
		if ( isNumeric(token) ) {
			while ( isNumeric(input[iter]) || input[iter] === '.' )
				out += input[iter++];
			return out;
		}
		
		// Унарный минус
		if (token === SUB && Ops.indexOf(prevToken) !== -1) {
			iter++;
			return UMIN;
		}
		
		// Оператор
		var next = '', _i = iter;
		do {
			if (_i >= input.length) break;
			next += input[_i++];
			for (var j = 0; j < AllOps.length; j++)
				if (AllOps[j].indexOf(next) !== -1) break;
		} while ( !(j === AllOps.length && AllOps[AllOps.length - 1].indexOf(next) === -1) );
		if (next.length > 1) next = next.substring(0, next.length - 1), _i--;
		
		if (next !== '' && AllOps.indexOf(next) !== -1) {
			while (WSpaces.indexOf(input[_i]) !== -1 && _i < input.length) _i++;
			if (next.match(/\w/) && input[_i] === '(' || !next.match(/\w/)) {
				out += next;
				iter += next.length;
			}
		}
			
	    return out;
	}
	
	// ======== Вспомогательные функции ========
	// getToken <<<<<<<<<<<<<<<<<<<<<<<<
	function delWS() {
		while (WSpaces.indexOf(input[iter]) !== -1 && iter < input.length) iter++;
	}
	
	// RPN <<<<<<<<<<<<<<<<<<<<<<<<
	function isNumeric(input) {
		var anum = /(^\d+$)|(^\d+\.\d+$)/;
		if ( input === '' || !anum.test(input))
			return false;
		return true;
	}
	function isOperator(token) {
		if (Ops.indexOf(token) === -1)
			return false;
		return true;
	}
	function prior(op) {
		switch (op) {
			case UMIN:
				return 4;
			case POW:
				return 3;
			case MULT:
			case DIV: 
				return 2;
			case ADD:
			case SUB: 
				return 1;
			case PAR:
			case RPAR:
				return 0;
			default: return null;
		}
	}
	function calc(op, a, b) {
		a = parseFloat(a);
		b = (b)? parseFloat(b) : null;
		switch (op) {
			case UMIN: return -a;
			case POW:  return Math.pow(a, b);
			case MULT: return a * b;
			case DIV:  return a / b;
			case ADD:  return a + b;
			case SUB:  return a - b;
			case SIN:  return Math.sin(a);
			case COS:  return Math.cos(a);
			default: return null;
		}
	}
}