import { IsAgainstTheWallRuleValidator } from "./is-against-the-wall"
import { IsHiddenFromTheEntraceRuleValidator } from "./is-hidden-from-the-entrance";

export const createPlacementRuleValidator = (ruleId: number) => {
    switch (ruleId) {
        case 1: return new IsAgainstTheWallRuleValidator();
        case 2: return new IsHiddenFromTheEntraceRuleValidator();
    }

    return null;
}