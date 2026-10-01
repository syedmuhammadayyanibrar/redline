import re
from typing import Dict, Any, List
from ..models.schemas import ConversationTurn, Role, ConversationMetadata


class ContextAnalyzer:
    """
    Maintains and accumulates conversational state across sequential dialogue turns.
    This enables full-context compliance rules to understand prior borrower disclosures,
    disputes, cease requests, and third-party identities.
    """

    def __init__(self, metadata: ConversationMetadata):
        self.metadata = metadata
        self.state: Dict[str, Any] = {
            "borrower_has_ceased": False,
            "cease_turn_id": None,
            "cease_text": None,
            "borrower_has_disputed": False,
            "dispute_turn_id": None,
            "dispute_text": None,
            "borrower_has_hardship": False,
            "hardship_turn_id": None,
            "hardship_text": None,
            "is_third_party": bool(metadata.is_third_party),
            "third_party_identifier": metadata.recipient_relationship if metadata.is_third_party else None,
            "mini_miranda_disclosed": False,
            "mini_miranda_turn_id": None,
            "debt_discussed": False,
        }

    def process_turn(self, turn: ConversationTurn) -> Dict[str, Any]:
        """
        Updates the internal context state based on the current turn.
        Returns a snapshot of the updated context state.
        """
        text_lower = turn.text.lower()

        if turn.speaker in [Role.BORROWER, Role.THIRD_PARTY]:
            # 1. Cease Communication Signals
            if re.search(
                r"(stop calling|cease|never call|do not call|don't call|remove my number|stop contacting|take me off your list|don't want you calling)",
                text_lower,
            ):
                self.state["borrower_has_ceased"] = True
                self.state["cease_turn_id"] = turn.turn_id
                self.state["cease_text"] = turn.text

            # 2. Dispute Signals
            if re.search(
                r"(dispute|don't owe|do not owe|not my (debt|bill|account)|already paid|billing error|insurance covered|wrong amount)",
                text_lower,
            ):
                self.state["borrower_has_disputed"] = True
                self.state["dispute_turn_id"] = turn.turn_id
                self.state["dispute_text"] = turn.text

            # 3. Third-party detection
            if re.search(
                r"(this is (his|her|my) (wife|husband|spouse|roommate|mom|dad|brother|sister)|he's not (here|available)|she's not (here|available)|i'm his|i'm her)",
                text_lower,
            ):
                self.state["is_third_party"] = True
                self.state["third_party_identifier"] = "spouse / third party"

            # 4. Hardship / Unemployment / Emergency
            if re.search(
                r"(lost my job|unemployed|no income|hospitalized|medical emergency|cannot afford|no money|zero income)",
                text_lower,
            ):
                self.state["borrower_has_hardship"] = True
                self.state["hardship_turn_id"] = turn.turn_id
                self.state["hardship_text"] = turn.text

        elif turn.speaker == Role.AGENT:
            # Mini-Miranda check
            if re.search(
                r"(attempt to collect a debt|debt collector|information obtained will be used for that purpose)",
                text_lower,
            ):
                self.state["mini_miranda_disclosed"] = True
                self.state["mini_miranda_turn_id"] = turn.turn_id

            if re.search(r"(debt|balance|past[- ]due|delinquent|unpaid|account|pay|payment|\$\d+)", text_lower):
                self.state["debt_discussed"] = True

        return self.get_state_snapshot()

    def get_state_snapshot(self) -> Dict[str, Any]:
        return dict(self.state)
