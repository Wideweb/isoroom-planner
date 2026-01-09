import { IsAgainstTheWallRuleValidator } from "./is-against-the-wall"

export const createPlacementRuleValidator = (ruleId: number) => {
    switch (ruleId) {
        case 0: return new IsAgainstTheWallRuleValidator();
    }

    return null;
}