import Editor from '@monaco-editor/react'
import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

import { Button } from '#/components/ui/button'

export function JsonPreview({ value }: { value: unknown }) {
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(value, null, 2)

  const copyJson = async () => {
    await navigator.clipboard.writeText(json)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl lg:sticky lg:top-5">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-100">
            Live JSON Preview
          </p>
          <p className="text-xs text-slate-400">Updates as you edit the form</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-slate-300 hover:bg-slate-800 hover:text-white"
          onClick={copyJson}
          aria-label="Copy JSON to clipboard"
        >
          {copied ? <Check /> : <Copy />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </header>
      <Editor
        height="620px"
        language="json"
        theme="vs-dark"
        value={json}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 13,
          folding: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
        }}
      />
    </section>
  )
}
