import { useEffect, useState } from "react";
import { Interpreter } from "~/core/graphene/interpreter";
import { Lexer } from "~/core/graphene/lexer";
import { Parser } from "~/core/graphene/parser";
import { Split } from "~/shared/layout/Split";
import { useEditorStore } from "../../pages/editor/context/editor";
import { DiagnosticsSummary } from "./components/Diagnostics";
import "./editor-styles.css";
import { editorOnChange, useEditor } from "./hooks/useEditor";

const initialEditorValue = `# Declare vertices
vertex([A, B, C, D, E, F, G])

# Add edges
edge(A, [B, C, D, E], 5)
edge(D, C)
edge(F, B)
edge(B, C)

# Add directed edges
arc(A, [F, G])
arc(E, C, 8)

# Learn more at Graphene Docs
# https://github.com/team-nullptr/graphite
`;

export const CodeEditor = () => {
  const setGraph = useEditorStore(({ setGraph }) => setGraph);
  const [value, setValue] = useState(initialEditorValue);
  const [errors, setErrors] = useState<Error[]>([]);

  const { view, ref } = useEditor<HTMLDivElement>([
    editorOnChange((value) => setValue(value)),
  ]);

  // TODO: It might be a good idea to extract code-mirrors specific logic.
  useEffect(() => {
    if (!view) {
      return;
    }

    const currentValue = view.state.doc.toString();

    if (value === currentValue) {
      return;
    }

    view.dispatch({
      changes: {
        from: 0,
        to: currentValue.length,
        insert: value,
      },
    });
  }, [view, value]);

  useEffect(() => {
    // Do we want to parse graph here?
    try {
      const tokens = new Lexer(value).lex();
      const stmts = new Parser(tokens).parse();
      const graph = new Interpreter(stmts).forge();

      setGraph(graph);
      setErrors([]);
    } catch (err) {
      if (err instanceof Error) setErrors([err]);
      else console.error("Unexpected error");
    }
  }, [setGraph, value]);

  return (
    <Split
      initialShare={75}
      orientation="horizontal"
      first={<div className="h-full" ref={ref} />}
      second={<DiagnosticsSummary errors={errors} />}
    />
  );
};
