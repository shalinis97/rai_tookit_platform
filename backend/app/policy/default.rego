package ai.policies

import rego.v1

###################################################
# DEFAULT RULES
###################################################

default allow := false

###################################################
# CONSTANTS
###################################################

safe_uncertainty_markers := {
    "may", "might", "could", "possible", "likely", "uncertain", "suggest"
}

high_risk_domain_terms := {
    "medical diagnosis",
    "legal judgment",
    "financial investment guarantee",
    "treatment prescription",
    "court verdict"
}

disallowed_authoritative_claims := {
    "guaranteed", "100%", "always correct", "no risk", "perfect result"
}

prompt_injection_signatures := {
    "ignore previous instructions",
    "system prompt",
    "override policy",
    "disregard safety",
    "developer mode"
}

global_pii_terms := {
    "ssn", "aadhaar", "passport number",
    "credit card", "bank account", "pan number"
}

global_bias_terms := {
    "young", "old", "male", "female",
    "married", "pregnant", "cultural fit"
}

harmful_terms := {
    "violence", "suicide", "self harm", "exploit", "abuse"
}

resume_bias_terms := {
    "young", "old", "male", "female",
    "married", "pregnant", "cultural fit"
}

###################################################
# HELPER RULES
###################################################

has_uncertainty if {
    some marker in safe_uncertainty_markers
    contains(lower(input.output), marker)
}

###################################################
# GLOBAL SAFETY — HIGH RISK DOMAINS
###################################################

deny contains msg if {
    some domain in high_risk_domain_terms
    contains(lower(input.output), domain)
    not has_uncertainty
    msg := sprintf("High-risk domain '%v' requires uncertainty qualifier", [domain])
}

###################################################
# GLOBAL SAFETY — AUTHORITATIVE CLAIMS
###################################################

deny contains msg if {
    some claim in disallowed_authoritative_claims
    contains(lower(input.output), claim)
    msg := sprintf("Authoritative claim '%v' not allowed — requires human oversight", [claim])
}

###################################################
# GLOBAL SAFETY — PROMPT INJECTION
###################################################

deny contains msg if {
    some sig in prompt_injection_signatures
    contains(lower(input.output), sig)
    msg := "Prompt injection pattern detected in output"
}

deny contains msg if {
    some sig in prompt_injection_signatures
    contains(lower(input.message), sig)
    msg := "Prompt injection pattern detected in user message"
}

###################################################
# GLOBAL SAFETY — HARMFUL CONTENT
###################################################

deny contains msg if {
    some term in harmful_terms
    contains(lower(input.output), term)
    msg := sprintf("Unsafe content detected: '%v'", [term])
}

###################################################
# GLOBAL PII DETECTION
###################################################

deny contains msg if {
    regex.match(`[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}`, input.output)
    msg := "PII detected: email address in output"
}

deny contains msg if {
    regex.match(`\b\d{10}\b`, input.output)
    msg := "PII detected: phone number in output"
}

deny contains msg if {
    some term in global_pii_terms
    contains(lower(input.output), term)
    msg := sprintf("PII keyword detected in output: '%v'", [term])
}

###################################################
# GLOBAL BIAS DETECTION
###################################################

deny contains msg if {
    some term in global_bias_terms
    contains(lower(input.output), term)
    msg := sprintf("Bias term detected in output: '%v'", [term])
}

###################################################
# CONTEXT LEAKAGE
###################################################

deny contains msg if {
    input.job_description != ""
    input.output == input.job_description
    msg := "Context memorization leakage detected"
}

###################################################
# RESUME SELECTOR AGENT POLICIES
###################################################

deny contains msg if {
    input.agent == "resume_selector"
    some term in resume_bias_terms
    contains(lower(input.job_description), term)
    msg := sprintf("Bias detected in job description: '%v'", [term])
}

deny contains msg if {
    input.agent == "resume_selector"
    some resume in input.resumes
    some term in resume_bias_terms
    contains(lower(resume), term)
    msg := sprintf("Bias detected in resume content: '%v'", [term])
}

deny contains msg if {
    input.agent == "resume_selector"
    input.consent != true
    msg := "User consent required for resume processing"
}

###################################################
# FINAL DECISION
###################################################

allow if {
    count(deny) == 0
}
