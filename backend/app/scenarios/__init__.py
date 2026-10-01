import json
from .data import SCENARIOS_DATA, load_all_scenarios, get_scenario_by_id

# Write out JSON representation for external tools or static imports
with open("c:\\redline\\backend\\app\\scenarios\\scenarios.json", "w", encoding="utf-8") as f:
    json.dump(SCENARIOS_DATA, f, indent=2)

__all__ = ["SCENARIOS_DATA", "load_all_scenarios", "get_scenario_by_id"]
