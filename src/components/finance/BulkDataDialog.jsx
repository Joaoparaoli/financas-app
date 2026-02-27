import { useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BulkAPI } from '@/lib/api'
import { feedback } from '@/lib/feedback'
import { Download, Upload, AlertTriangle } from 'lucide-react'

export default function BulkDataDialog({ open, onOpenChange, onImportComplete }) {
  const fileInputRef = useRef(null)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')

  const handleExport = async () => {
    try {
      setError('')
      setExporting(true)
      const data = await BulkAPI.export()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      link.href = url
      link.download = `financas-backup-${date}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      feedback('success')
    } catch (err) {
      console.error('bulk export error', err)
      setError('Não foi possível exportar os dados. Tente novamente.')
    } finally {
      setExporting(false)
    }
  }

  const handleChooseFile = () => {
    setError('')
    fileInputRef.current?.click()
  }

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setImporting(true)
      const text = await file.text()
      const parsed = JSON.parse(text)
      const { exportedAt, ...data } = parsed
      await BulkAPI.import(data)
      feedback('success')
      onImportComplete?.()
      onOpenChange(false)
    } catch (err) {
      console.error('bulk import error', err)
      setError('Arquivo inválido ou erro ao importar. Verifique o JSON e tente novamente.')
    } finally {
      setImporting(false)
      event.target.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Backup em Massa</DialogTitle>
          <DialogDescription>
            Exporte todos os dados para um arquivo .json e importe novamente quando estiver em outro ambiente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <section className="rounded-3xl border border-border/40 bg-card/70 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Exportar</p>
                <p className="text-xs text-muted-foreground">Baixa todas as entradas, cartões, patrimônio, metas e assinaturas.</p>
              </div>
              <Button onClick={handleExport} disabled={exporting} className="gap-2">
                <Download className="h-4 w-4" />
                {exporting ? 'Gerando...' : 'Baixar JSON'}
              </Button>
            </div>
          </section>

          <section className="rounded-3xl border border-border/40 bg-card/70 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Importar</p>
                <p className="text-xs text-muted-foreground">Substitui todos os dados atuais pelo arquivo selecionado.</p>
              </div>
              <Button onClick={handleChooseFile} disabled={importing} variant="secondary" className="gap-2">
                <Upload className="h-4 w-4" />
                {importing ? 'Importando...' : 'Selecionar arquivo'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleImportFile}
              />
            </div>
            <div className="flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
              <p>
                Ao importar, todos os dados locais serão apagados antes de subir o novo arquivo. Faça um backup antes de continuar.
              </p>
            </div>
          </section>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
