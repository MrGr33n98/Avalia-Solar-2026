# shadcn-ui – Guia de Componentes

## Componentes usados
- Tabs: organização Fotos/Vídeos.
- Dialog: entrada de URL YouTube.
- Button, Card, Input, Toast.

## Exemplos
```tsx
<Tabs value="videos">
  <TabsList>
    <TabsTrigger value="photos">Fotos</TabsTrigger>
    <TabsTrigger value="videos">Vídeos</TabsTrigger>
  </TabsList>
  <TabsContent value="videos">...</TabsContent>
  <TabsContent value="photos">...</TabsContent>
  </Tabs>
```

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader><DialogTitle>Adicionar Vídeo</DialogTitle></DialogHeader>
    <Input placeholder="URL do YouTube" />
    <DialogFooter><Button>Enviar</Button></DialogFooter>
  </DialogContent>
</Dialog>
```

