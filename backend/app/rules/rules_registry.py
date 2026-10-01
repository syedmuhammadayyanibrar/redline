from typing import List, Dict, Optional
from .base import ComplianceRule
from .definitions import (
    CeaseContactRule,
    ThirdPartyDisclosureRule,
    DisputedDebtRule,
    CallingTimeRestrictionRule,
    MisleadingLegalThreatRule,
    RepeatedContactRule,
    SensitiveDataThirdPartyRule,
    HardshipDisregardRule,
    MiniMirandaRule,
)


class RulesRegistry:
    """
    Central registry for all active compliance rules.
    """

    def __init__(self):
        self._rules: Dict[str, ComplianceRule] = {}
        self._register_default_rules()

    def _register_default_rules(self):
        default_rules = [
            CeaseContactRule(),
            ThirdPartyDisclosureRule(),
            DisputedDebtRule(),
            CallingTimeRestrictionRule(),
            MisleadingLegalThreatRule(),
            RepeatedContactRule(),
            SensitiveDataThirdPartyRule(),
            HardshipDisregardRule(),
            MiniMirandaRule(),
        ]
        for rule in default_rules:
            self._rules[rule.rule_id] = rule

    def get_all_rules(self) -> List[ComplianceRule]:
        return list(self._rules.values())

    def get_rule(self, rule_id: str) -> Optional[ComplianceRule]:
        return self._rules.get(rule_id)


# Global singleton instance
rules_registry = RulesRegistry()
