"use client";

import { ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import { MentionList, type MentionItem, type MentionListHandle } from "./MentionList";
import type { Lead } from "@/lib/types";

function matches(query: string, lead: Lead): boolean {
  const q = query.toLowerCase();
  if (!q) return true;
  return (
    lead.name.toLowerCase().includes(q) ||
    (lead.company ?? "").toLowerCase().includes(q) ||
    (lead.role ?? "").toLowerCase().includes(q) ||
    lead.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export function buildMentionSuggestion(
  leadsRef: { current: Lead[] },
): Omit<SuggestionOptions<MentionItem>, "editor"> {
  return {
    char: "@",
    allowSpaces: false,
    startOfLine: false,
    items: ({ query }) =>
      (leadsRef.current || [])
        .filter((l) => matches(query, l))
        .slice(0, 8)
        .map(
          (l): MentionItem => ({
            id: l.id,
            label: l.name,
            company: l.company,
            stage: l.stage,
            avatar_color: l.avatar_color,
          }),
        ),
    render: () => {
      let component: ReactRenderer<MentionListHandle> | null = null;
      let popup: TippyInstance[] | null = null;

      return {
        onStart: (props) => {
          component = new ReactRenderer(MentionList, { props, editor: props.editor });
          if (!props.clientRect) return;
          popup = tippy("body", {
            getReferenceClientRect: () => props.clientRect!() ?? new DOMRect(),
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
            arrow: false,
            theme: "atlas-mention",
            offset: [0, 6],
          });
        },
        onUpdate: (props) => {
          component?.updateProps(props);
          if (!props.clientRect) return;
          popup?.[0]?.setProps({
            getReferenceClientRect: () => props.clientRect!() ?? new DOMRect(),
          });
        },
        onKeyDown: (props) => {
          if (props.event.key === "Escape") {
            popup?.[0]?.hide();
            return true;
          }
          return component?.ref?.onKeyDown(props.event) ?? false;
        },
        onExit: () => {
          popup?.[0]?.destroy();
          component?.destroy();
          popup = null;
          component = null;
        },
      };
    },
  };
}
