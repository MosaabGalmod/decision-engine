# System Architecture: The Decision Engine

```mermaid
graph TD
    A["Proposed Action + Context"] --> B["Decision Pipeline"]
    B --> C1["Risk Engine (0-100)"]
    B --> C2["Confidence Scorer (0-100%)"]
    B --> C3["Reversibility Checker (Reversible / Irreversible)"]
    B --> C4["Missing Info & Policy Validator"]
    
    C1 & C2 & C3 & C4 --> D["Decision Logic Evaluator"]
    
    D --> E1["EXECUTE (Low Risk, High Confidence, Reversible)"]
    D --> E2["ASK (Missing Info or Minor Ambiguity)"]
    D --> E3["DEFER (Awaiting External Condition/Time)"]
    D --> E4["ESCALATE (High Risk, Irreversible, Human Approval)"]
    D --> E5["REFUSE (Violates Security Policy / Unsafe)"]
    
    E1 & E2 & E3 & E4 & E5 --> F["Tamper-Proof Audit Trail (JSON + SHA256 Hash)"]
    F --> G["Interactive Dashboard & Real-Time API"]
```

## Flow Description

1. **Input**: A `ProposedAction` is sent to the system containing the domain, action type, payload, and context (user role, IP, time).
2. **Analysis**: The pipeline evaluates the action across four vectors:
   - **Risk Engine**: Calculates a score based on the action's destructive potential and domain.
   - **Confidence Scorer**: Checks if we have enough data and context to be sure of the intent.
   - **Reversibility**: Determines if the action can be easily undone (e.g., dropping a database vs updating a row).
   - **Validator**: Checks for missing fields required for the specific action.
3. **Logic Evaluator**: Combines the signals into one of the 5 mandatory states (`execute`, `ask`, `defer`, `escalate`, `refuse`).
4. **Audit**: The decision is hashed using SHA-256 and appended to a tamper-proof audit log.
