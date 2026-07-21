# iSWE-Agent

iSWE-Agent is a multi-agent system developed by IBM Research to tackle software engineering tasks. 

Our arXiv paper, which includes additional details, is now available at: [Resolving Java Code Repository Issues with iSWE Agent](https://arxiv.org/abs/2603.11356v1)

The latest release of iSWE focuses on Java development and is built using IBM’s [Prompt Declaration Language (PDL)](https://github.com/IBM/prompt-declaration-language). Earlier versions of iSWE were designed for Python, achieved competitive rankings on the [SWE-Bench Lite leaderboard](https://www.swebench.com/), and were showcased at [IBM TechXchange 2024](https://research.ibm.com/blog/ibm-swe-agents).

| Agent/Model | %Resolved | Date | Site |
| --- | --- | --- | --- |
| IBM Research Agent-101 | 26.67 | 2024-06-12 | [README](https://github.com/swe-bench/experiments/tree/main/evaluation/lite/20240612_IBM_Research_Agent101) |
| IBM AI Agent SWE-1.0 (with open LLMs) | 23.67 | 2024-10-16 | [README](https://github.com/swe-bench/experiments/tree/main/evaluation/lite/20241016_IBM-SWE-1.0) |

The iSWE Agent currently consists of two components: the _Localization_ agent and the _Editing_ agent, which operate in a sequential workflow. Unlike the conventional approach that relies on `bash` for code navigation and `str_replace_edit` for patch generation, iSWE introduces a **novel** methodology for both code understanding and editing.

We evaluated the performance of this development version of the iSWE Agent across multiple models using the Java subset of the Multi-SWE-Bench dataset, and compared against the top-3 ranking systems on the leaderboard.

| Agent + Model | %Resolved |
| --- | --- | 
|  &#9733; iSWE + Claude-4.5-Sonnet (Localization & Editing) | 33.59 | 
|    iSWE-OpenModels | 31.25 | 
|  &#9733; iSWE + Claude-4.5-Sonnet (Localization), Gemini-2.5-Pro (Editing) | 29.68 |
|    MSWE-agent + Gemini-2.5-Pro | 28.91 |
|  &#9733; iSWE + Claude-3.7-Sonnet (Localization & Editing) | 25.00 | 
|   MSWE-agent + Claude-3.7-Sonnet | 23.44 | 

![iSWE-Agent Overview](images/overview.png)

The iSWE Localization Agent:
- uses a traditional function-calling approach rather than native tool-calling,
- restricts LLM access to bash, preventing execution of arbitrary shell commands, and
- implements 7 custom tools built on AST analysis and static code inspection, leveraging tree_sitter and IBM's [Codellm-Devkit](https://codellm-devkit.info/) toolkit. These tools can be invoked by the LLM: get_call_chain, get_class_info, get_file_info, get_function_callers, get_inheritance_hierarchy, get_method_info, get_symbol_info.

The iSWE Editing Agent:
- enhances the diff-based merge-conflict edit format with custom tweaks to support edits across multiple locations and files,
- integrates validation checks using both linting and compilation feedback to guarantee syntax correctness before applying changes, and
- does not use Anthropic's `str_replace_edit` tool, commonly used by other agents such as (M)SWE-Agent, (M)OpenHands and (M)Agentless.


### NOTE

iSWE submission

- [x] Pass@1 submission
- [x] Does not use the comments on the original issue as input, commonly referred to as `hints_text`
- [x] No Multi-SWE-bench Test knowledge (`PASS_TO_PASS`, `FAIL_TO_PASS`)
- [x] Does not resolve any of the instances identified in [Golden patch for java instances achieve 111/128 resolution rate #57](https://github.com/multi-swe-bench/multi-swe-bench/issues/57) where the evaluation pipeline fails even for gold patches
- [x] No cheating allowed: Does not allow the LLM to cheat by running `git log –all`, `git show <commit_id>` etc., since `bash` access is restricted and only a limited number of tools are allowed.
- [x] Does not use the new `hints` field in [Multi-SWE-bench](https://github.com/multi-swe-bench/multi-swe-bench?tab=readme-ov-file#-news), which describes the newly defined variables in test.patch and fix.patch required for certain instances.
