#!/usr/bin/env python3
"""Local project context, evidence, feedback, outcome reports and follow-up specifications.

Uses the existing .extension-builder/project.json. Inputs/outputs stay project-relative.
This helper performs no network requests, background execution or host scheduler actions.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from intelligence_examples import EXAMPLES
from intelligence_records import RECORDERS, ensure_intelligence, fingerprint, identifier, job_state, now, read_input
from intelligence_reports import builder_export, export_report, job_view, report_view
from project_lock import project_lock
from session import load_state, state_path, write_state
from project_guard import project_root
from contextlib import nullcontext


def parser():
    result = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    commands = result.add_subparsers(dest='command', required=True)
    examples = commands.add_parser('examples', help='print a synthetic editable JSON input shape; no project access')
    examples.add_argument('--kind', required=True, choices=tuple(EXAMPLES))
    for name in RECORDERS:
        command = commands.add_parser(name, help=f'record sanitized local {name} input')
        command.add_argument('project', type=Path)
        command.add_argument('--input', required=True, help='project-relative JSON; use a concise summary, never secrets or raw transcripts')
    for name in ('init', 'show', 'jobs'):
        command = commands.add_parser(name)
        command.add_argument('project', type=Path)
    command = commands.add_parser('job-state', help='record local activation evidence or pause/stop intent; never changes host scheduler')
    command.add_argument('project', type=Path)
    command.add_argument('--job', required=True)
    command.add_argument('--state', required=True, choices=('activation-recorded', 'paused', 'stopped'))
    command.add_argument('--input', help='activation JSON with host, scheduler_reference, activation_evidence')
    command = commands.add_parser('rebind', help='explicitly bind reviewed transferred context to this project location')
    command.add_argument('project', type=Path)
    command.add_argument('--project-id', required=True)
    for name in ('report', 'feedback-export'):
        command = commands.add_parser(name, help='export local JSON and Markdown; no upload')
        command.add_argument('project', type=Path)
        command.add_argument('--output', required=True, help='project-relative output basename; creates BASENAME.json and BASENAME.md')
        command.add_argument('--force', action='store_true')
        if name == 'report':
            command.add_argument('--kind', choices=('session', 'project', 'feedback', 'scheduled'), default='project')
    return result


def main():
    args = parser().parse_args()
    if args.command == 'examples':
        print(json.dumps(EXAMPLES[args.kind], indent=2, ensure_ascii=False))
        return
    try:
        root = project_root(args.project)
        if not state_path(root).is_file():
            raise ValueError('initialize this project with session.py init PROJECT --name NAME --mode local|cloud|hybrid first')
        with (nullcontext() if args.command in {'show', 'jobs', 'report', 'feedback-export'} else project_lock(root)):
            state = load_state(root, check_integrity=False, allow_rebind=args.command == 'rebind')
            legacy = 'intelligence' not in state
            if legacy and args.command in {'show', 'jobs', 'report', 'feedback-export'}:
                raise ValueError('legacy project has no continuity identity; run intelligence.py init PROJECT or record context first (read-only commands do not migrate)')
            intelligence = ensure_intelligence(state, root, allow_rebind=args.command == 'rebind')
            payload = read_input(root, args.input) if getattr(args, 'input', None) else None
            changed = args.command not in {'show', 'jobs', 'report', 'feedback-export'}
            if args.command in RECORDERS:
                RECORDERS[args.command](root, intelligence, payload)
            elif args.command == 'job-state':
                job_state(root, intelligence, identifier(args.job), args.state, payload)
            elif args.command == 'rebind':
                if args.project_id != intelligence['identity']['project_id']:
                    raise ValueError('project ID does not match the transferred record')
                intelligence['identity']['root_sha256'] = fingerprint(root)
            if args.command == 'jobs':
                output = {'jobs': [job_view(root, item) for item in intelligence['jobs']], 'scheduler_executed_by_plugin': False, 'notice': 'Definitions and local intent only; actual host activation and controls require explicit user action.'}
            elif args.command in {'report', 'feedback-export'}:
                view = builder_export(intelligence) if args.command == 'feedback-export' else report_view(root, state, args.kind)
                output = export_report(root, args.output, view, force=args.force)
            else:
                output = report_view(root, state, 'session' if args.command == 'show' else 'project')
            if changed:
                if len(intelligence['activity']) >= 1000:
                    raise ValueError('local activity limit reached; export and review before continuing')
                intelligence['activity'].append({'action': args.command, 'recorded_at': now()})
                write_state(state_path(root), state)
            print(json.dumps(output, indent=2, ensure_ascii=False))
    except (OSError, ValueError, KeyError, TypeError, RecursionError) as exc:
        raise SystemExit(str(exc))


if __name__ == '__main__':
    main()
