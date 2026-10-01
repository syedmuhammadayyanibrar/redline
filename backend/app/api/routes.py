from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..models.schemas import (
    Scenario,
    Conversation,
    EvaluationMode,
    EvaluationResult,
    ComparisonEvaluationResponse,
    CustomEvaluationRequest,
    BenchmarkSummary,
)
from ..scenarios.data import load_all_scenarios, get_scenario_by_id
from ..services.evaluation_service import evaluation_service
from ..services.benchmark_service import benchmark_service
from ..rules.rules_registry import rules_registry

router = APIRouter()


@router.get("/health")
def health_check():
    return {"status": "healthy", "service": "Redline Compliance Engine", "version": "1.0.0"}


@router.get("/rules")
def get_all_rules():
    """Retrieve all active compliance rules and their legal/operational specifications."""
    return [rule.to_dict() for rule in rules_registry.get_all_rules()]


@router.get("/scenarios", response_model=List[Scenario])
def list_scenarios():
    """Retrieve all 8 benchmark scenarios."""
    return load_all_scenarios()


@router.get("/scenarios/{scenario_id}", response_model=Scenario)
def get_scenario(scenario_id: str):
    """Retrieve detailed scenario configuration and both agent transcripts."""
    try:
        return get_scenario_by_id(scenario_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found.")


@router.post("/scenarios/{scenario_id}/compare", response_model=ComparisonEvaluationResponse)
def compare_scenario(
    scenario_id: str,
    agent_type: str = Query("baseline", pattern="^(baseline|guarded)$"),
):
    """Run Turn-Level vs. Full-Context comparison on a specific scenario."""
    try:
        scenario = get_scenario_by_id(scenario_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_id}' not found.")

    conversation = (
        scenario.baseline_conversation
        if agent_type == "baseline"
        else scenario.guarded_conversation
    )
    return evaluation_service.compare_conversation(conversation)


@router.post("/evaluate/custom", response_model=ComparisonEvaluationResponse)
def evaluate_custom_transcript(request: CustomEvaluationRequest):
    """Parse custom pasted transcript text and run Turn-Level vs. Full-Context comparison."""
    if not request.transcript_text or not request.transcript_text.strip():
        raise HTTPException(status_code=400, detail="Transcript text cannot be empty.")
    return evaluation_service.evaluate_custom_transcript(request)


@router.post("/evaluate/conversation", response_model=EvaluationResult)
def evaluate_conversation(
    conversation: Conversation,
    mode: EvaluationMode = EvaluationMode.FULL_CONTEXT,
):
    """Evaluate a structured Conversation object in a specific mode."""
    return evaluation_service.evaluate_conversation(conversation, mode)


@router.get("/benchmark", response_model=BenchmarkSummary)
def get_benchmark_metrics():
    """Run complete deterministic benchmark over all scripted scenarios and return calculated metrics."""
    return benchmark_service.run_full_benchmark()
