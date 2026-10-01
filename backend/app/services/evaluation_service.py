import re
from typing import List, Optional
from ..models.schemas import (
    Conversation,
    ConversationTurn,
    ConversationMetadata,
    Role,
    EvaluationMode,
    EvaluationResult,
    ComparisonEvaluationResponse,
    CustomEvaluationRequest,
)
from ..engine.evaluator import evaluator


class EvaluationService:
    """
    Handles conversation evaluation requests and text transcript parsing.
    """

    def parse_transcript_text(
        self,
        raw_text: str,
        local_time: Optional[str] = "14:15",
        attempts_7_days: Optional[int] = 1,
        is_third_party: Optional[bool] = False,
    ) -> Conversation:
        """
        Parses text transcripts formatted as:
        BORROWER: ...
        AGENT: ...
        """
        lines = [line.strip() for line in raw_text.strip().split("\n") if line.strip()]
        turns: List[ConversationTurn] = []
        turn_counter = 1

        for line in lines:
            # Check speaker match: "Agent:", "Borrower:", "Third Party:"
            match = re.match(r"^(agent|borrower|third[\s_-]?party|spouse|roommate):\s*(.*)$", line, re.IGNORECASE)
            if match:
                speaker_str = match.group(1).lower()
                text = match.group(2).strip()

                if "agent" in speaker_str:
                    speaker = Role.AGENT
                elif any(tp in speaker_str for tp in ["third", "spouse", "roommate"]):
                    speaker = Role.THIRD_PARTY
                else:
                    speaker = Role.BORROWER

                turns.append(
                    ConversationTurn(
                        turn_id=turn_counter,
                        speaker=speaker,
                        text=text,
                    )
                )
                turn_counter += 1
            else:
                # If no prefix, continue previous speaker or default to Agent
                prev_speaker = turns[-1].speaker if turns else Role.AGENT
                turns.append(
                    ConversationTurn(
                        turn_id=turn_counter,
                        speaker=prev_speaker,
                        text=line,
                    )
                )
                turn_counter += 1

        metadata = ConversationMetadata(
            call_time=local_time or "14:15",
            call_attempts_last_7_days=attempts_7_days or 1,
            is_third_party=is_third_party or False,
        )

        return Conversation(
            id="CUSTOM-TRANSCRIPT",
            title="Custom Transcript Test",
            metadata=metadata,
            turns=turns,
        )

    def evaluate_custom_transcript(
        self, request: CustomEvaluationRequest
    ) -> ComparisonEvaluationResponse:
        conversation = self.parse_transcript_text(
            raw_text=request.transcript_text,
            local_time=request.local_time,
            attempts_7_days=request.attempts_7_days,
            is_third_party=request.is_third_party,
        )
        return evaluator.compare_modes(conversation)

    def evaluate_conversation(
        self, conversation: Conversation, mode: EvaluationMode
    ) -> EvaluationResult:
        return evaluator.evaluate_conversation(conversation, mode)

    def compare_conversation(
        self, conversation: Conversation
    ) -> ComparisonEvaluationResponse:
        return evaluator.compare_modes(conversation)


evaluation_service = EvaluationService()
