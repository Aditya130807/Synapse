import type { AgentContext, AgentRoutingDecision, CollaborationDecision } from './agent.types.js';
import { agentRegistry } from './agent.registry.js';

export class AgentRouter {
  /**
   * Evaluates prompt intent, context, and attached files to deterministically route to the best specialized agent.
   * Employs conservative priority routing: Document > Coding > Research > General Fallback.
   * Ambiguous queries always fallback to GeneralAgent.
   */
  public async route(context: AgentContext): Promise<AgentRoutingDecision> {
    const availableAgents = agentRegistry.getAll();
    const candidates = availableAgents.map((a) => a.id);

    const hasAttachments = context.messageFileIds && context.messageFileIds.length > 0;
    const queryLower = context.query.toLowerCase().trim();

    // 1. Document Agent Routing Check
    if (hasAttachments) {
      const docActionKeywords = ['explain', 'summarize', 'compare', 'analyze', 'what does', 'review', 'read'];
      const docTermKeywords = ['document', 'file', 'pdf', 'readme', 'attached', 'this project'];

      const hasDocAction = docActionKeywords.some((kw) => queryLower.includes(kw));
      const hasDocTerm = docTermKeywords.some((kw) => queryLower.includes(kw));
      const asksAboutAttachedDoc = (hasDocAction && hasDocTerm) || queryLower.includes('attached');

      const isCodeDebuggingAttached =
        queryLower.includes('parser throwing') || queryLower.includes('bug in') || queryLower.includes('fix error in');

      if (asksAboutAttachedDoc && !isCodeDebuggingAttached && agentRegistry.has('document')) {
        return {
          agentId: 'document',
          reason: 'User attached file(s) and explicitly requested document analysis or explanation.',
          confidence: 0.96,
          candidates,
        };
      }
    }

    // 2. Coding Agent Routing Check
    const codingSpecificPatterns = [
      'returning 500',
      'returning 400',
      'throwing an error',
      'throws error',
      'exception in',
      'stack trace',
      'fix this bug',
      'fix this error',
      'typescript error',
      'javascript error',
      'syntax error',
      'type error',
      'component rerender',
      'rerender',
      'refactor this',
      'review this api design',
      'review this code',
      'explain this function',
      'write a function',
      'write a component',
      'sql query for',
      'database schema design',
    ];

    const isCodingIntent = codingSpecificPatterns.some((pattern) => queryLower.includes(pattern));

    if (isCodingIntent && agentRegistry.has('coding')) {
      return {
        agentId: 'coding',
        reason: 'User prompt indicates software engineering, debugging, code review, or error resolution intent.',
        confidence: 0.92,
        candidates,
      };
    }

    // 3. Research Agent Routing Check
    const researchSpecificPatterns = [
      'compare ',
      ' vs ',
      ' versus ',
      'pros and cons',
      'tradeoffs',
      'trade-offs',
      'evaluate options',
      'what should i use for',
      'differences between',
      'differ between',
    ];

    const isResearchIntent = researchSpecificPatterns.some((pattern) => queryLower.includes(pattern));

    if (isResearchIntent && agentRegistry.has('research')) {
      return {
        agentId: 'research',
        reason: 'User prompt indicates technical research, trade-off evaluation, or comparative analysis intent.',
        confidence: 0.90,
        candidates,
      };
    }

    // 4. Default Fallback -> General Agent
    return {
      agentId: 'general',
      reason: 'No specialized intent detected — fallback to general agent.',
      confidence: 0.80,
      candidates,
    };
  }

  /**
   * Deterministically evaluates whether multi-agent collaboration (parallel or sequential) is required for complex tasks.
   * If single domain is sufficient, conservatively returns mode: 'single'.
   */
  public async routeCollaboration(context: AgentContext): Promise<CollaborationDecision> {
    const queryLower = context.query.toLowerCase().trim();
    const hasAttachments = context.messageFileIds && context.messageFileIds.length > 0;

    // Check 1: Multi-domain Coding + Research (Parallel Audit / Compare Architecture against Best Practices)
    const isArchitectureAnalysis = queryLower.includes('architecture') || queryLower.includes('audit');
    const isBestPracticeComparison =
      queryLower.includes('best practice') ||
      queryLower.includes('best-practice') ||
      queryLower.includes('security issues') ||
      queryLower.includes('industry standard');

    if (isArchitectureAnalysis && isBestPracticeComparison && agentRegistry.has('coding') && agentRegistry.has('research')) {
      return {
        mode: 'parallel',
        agents: ['coding', 'research'],
        reason: 'Request requires concurrent implementation analysis (Coding Agent) and external best-practice evaluation (Research Agent).',
        confidence: 0.94,
        tasks: [
          {
            id: 'task-1',
            agentId: 'coding',
            objective: 'Analyze internal codebase architecture, components, and implementation structure.',
          },
          {
            id: 'task-2',
            agentId: 'research',
            objective: 'Evaluate security standards, architectural best practices, and comparative industry trade-offs.',
          },
        ],
      };
    }

    // Check 2: Multi-domain Document + Coding (Sequential Document Review & Implementation Evaluation)
    const isDocReview = queryLower.includes('review') || queryLower.includes('examine') || queryLower.includes('explain');
    const isImplRisk = queryLower.includes('implementation risk') || queryLower.includes('implementation') || queryLower.includes('risk');

    if (hasAttachments && isDocReview && isImplRisk && agentRegistry.has('document') && agentRegistry.has('coding')) {
      return {
        mode: 'sequential',
        agents: ['document', 'coding'],
        reason: 'Request requires initial attached document extraction (Document Agent) followed by technical risk evaluation (Coding Agent).',
        confidence: 0.91,
        tasks: [
          {
            id: 'task-1',
            agentId: 'document',
            objective: 'Extract architectural specifications, requirements, and structural details from attached document.',
          },
          {
            id: 'task-2',
            agentId: 'coding',
            objective: 'Evaluate code implementation risks, framework constraints, and engineering impact based on extracted specifications.',
            dependencies: ['task-1'],
          },
        ],
      };
    }

    // Fallback: Single Agent Execution
    const singleDecision = await this.route(context);
    return {
      mode: 'single',
      agents: [singleDecision.agentId],
      reason: singleDecision.reason,
      confidence: singleDecision.confidence,
      tasks: [
        {
          id: 'task-1',
          agentId: singleDecision.agentId,
          objective: context.query,
        },
      ],
    };
  }
}

export const agentRouter = new AgentRouter();
