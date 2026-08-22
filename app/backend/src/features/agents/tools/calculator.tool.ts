import type { Tool, ToolInputSchema } from './tool.types.js';
import type { AgentCapability, AgentContext } from '../agent.types.js';

export interface CalculatorInput {
  expression: string;
}

export interface CalculatorOutput {
  expression: string;
  result: number;
}

/**
 * Safe Mathematical Expression Evaluator.
 * Parses and computes arithmetic expressions WITHOUT using eval() or Function().
 */
export function evaluateSafeMath(rawExpr: string): number {
  let expr = rawExpr.trim().toLowerCase();

  // Handle "X% of Y" pattern (e.g. "17.5% of 840" or "15% of 240")
  const pctOfMatch = expr.match(/^([0-9\.]+)\%\s+of\s+([0-9\.]+)$/);
  if (pctOfMatch) {
    const pct = parseFloat(pctOfMatch[1]);
    const total = parseFloat(pctOfMatch[2]);
    if (isNaN(pct) || isNaN(total)) throw new Error('Invalid percentage values');
    return (pct / 100) * total;
  }

  // Replace percentage tokens e.g. "50%" -> "0.5"
  expr = expr.replace(/([0-9\.]+)\%/g, '($1/100)');
  // Replace exponentiation operator "**" with "^"
  expr = expr.replace(/\*\*/g, '^');

  // Tokenize arithmetic expression safely
  const tokens: string[] = [];
  let i = 0;
  while (i < expr.length) {
    const char = expr[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (/[0-9\.]/.test(char)) {
      let numStr = '';
      while (i < expr.length && /[0-9\.]/.test(expr[i])) {
        numStr += expr[i];
        i++;
      }
      tokens.push(numStr);
      continue;
    }

    if (['+', '-', '*', '/', '^', '(', ')'].includes(char)) {
      // Handle negative numbers e.g. "-5" or "( - 3)"
      if (char === '-' && (tokens.length === 0 || tokens[tokens.length - 1] === '(' || ['+', '-', '*', '/', '^'].includes(tokens[tokens.length - 1]))) {
        i++;
        let numStr = '-';
        while (i < expr.length && /[0-9\.]/.test(expr[i])) {
          numStr += expr[i];
          i++;
        }
        if (numStr === '-') throw new Error('Invalid negative operator placement');
        tokens.push(numStr);
        continue;
      }
      tokens.push(char);
      i++;
      continue;
    }

    throw new Error(`Invalid character in math expression: "${char}"`);
  }

  if (tokens.length === 0) {
    throw new Error('Empty expression');
  }

  // Shunting-yard algorithm to parse RPN
  const precedence: Record<string, number> = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
    '^': 3,
  };

  const outputQueue: string[] = [];
  const operatorStack: string[] = [];

  for (const token of tokens) {
    if (!isNaN(parseFloat(token))) {
      outputQueue.push(token);
    } else if (token in precedence) {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== '(' &&
        precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
      ) {
        outputQueue.push(operatorStack.pop()!);
      }
      operatorStack.push(token);
    } else if (token === '(') {
      operatorStack.push(token);
    } else if (token === ')') {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
        outputQueue.push(operatorStack.pop()!);
      }
      if (operatorStack.length === 0) throw new Error('Mismatched parentheses');
      operatorStack.pop(); // Remove '('
    }
  }

  while (operatorStack.length > 0) {
    const top = operatorStack.pop()!;
    if (top === '(' || top === ')') throw new Error('Mismatched parentheses');
    outputQueue.push(top);
  }

  // Evaluate RPN
  const stack: number[] = [];
  for (const token of outputQueue) {
    if (!isNaN(parseFloat(token))) {
      stack.push(parseFloat(token));
    } else {
      if (stack.length < 2) throw new Error('Invalid math expression syntax');
      const b = stack.pop()!;
      const a = stack.pop()!;
      switch (token) {
        case '+':
          stack.push(a + b);
          break;
        case '-':
          stack.push(a - b);
          break;
        case '*':
          stack.push(a * b);
          break;
        case '/':
          if (b === 0) throw new Error('Division by zero');
          stack.push(a / b);
          break;
        case '^':
          stack.push(Math.pow(a, b));
          break;
      }
    }
  }

  if (stack.length !== 1) throw new Error('Invalid expression evaluation');
  return stack[0];
}

export class CalculatorTool implements Tool<CalculatorInput, CalculatorOutput> {
  public readonly id = 'calculator';
  public readonly name = 'Calculator Tool';
  public readonly description =
    'Performs exact, reliable arithmetic computations for math expressions, percentages, powers, and equations.';

  public readonly requiredCapabilities: AgentCapability[] = ['calculator.execute'];

  public readonly inputSchema: ToolInputSchema = {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Mathematical expression to compute (e.g. "17.5% of 840", "(10 + 5) * 4", "2^10")',
      },
    },
    required: ['expression'],
  };

  public async execute(input: CalculatorInput, _context: AgentContext): Promise<CalculatorOutput> {
    if (!input || !input.expression) {
      throw new Error('Calculator tool requires an "expression" string parameter.');
    }

    const result = evaluateSafeMath(input.expression);
    return {
      expression: input.expression,
      result,
    };
  }
}

export const calculatorTool = new CalculatorTool();
