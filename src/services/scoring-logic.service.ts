export interface SubmissionContent {
  source_code: string;
  documentation?: string;
}

export interface ScoringResult {
  score: number;
  feedback: string;
}

class ScoringLogicService {
    public calculate(content: SubmissionContent): ScoringResult {

        let score = 0;
        const feedbackList: String[] = [];

        const code = content.source_code || '';
        const documentation = content.documentation || '';

        const codeLower = code.toLowerCase();

        // CODE QUALITY SCORING
        let qualityScore = 0;
        if (code.length > 20) 
            qualityScore += 10;

        if (code.includes('const ') || code.includes('let ') || code.includes('=>')) {
            qualityScore += 20;
            feedbackList.push("Code Quality: Modern syntax detected (ES6+).");
        } else {
            feedbackList.push("Code Quality: Consider using 'const/let' instead of 'var'.");
        }

        if (code.includes('//') || code.includes('/*')) {
            qualityScore += 10;
            feedbackList.push("Code Quality: Good commenting practice.");
        }   
        score += qualityScore;

        // Documentation scoring
        if (documentation.length > 10) {
            score += 30;
            feedbackList.push("Documentation: Explanation provided.");
        } else {
            feedbackList.push("Documentation: Missing or too short (-30%).");
        }

        // PERFORMANCE SCORING
        const keywords = ['optimize', 'cache', 'async', 'await', 'return', 'map', 'reduce'];
        const foundKeywords = keywords.filter(k => codeLower.includes(k));
        
        if (foundKeywords.length > 0) {
            score += 30;
            feedbackList.push(`Performance: Used keywords: ${foundKeywords.join(', ')}.`);
        } else {
            score += 10; 
            feedbackList.push("Performance: Basic implementation.");
        }

        return {
            score: Math.min(100, score),
            feedback: feedbackList.join('\n')
        };
    }
}

export default new ScoringLogicService();