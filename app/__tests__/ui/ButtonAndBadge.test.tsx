import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { ThemeProvider } from '../../src/theme/ThemeProvider';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';

describe('UI Components - Snapshot Tests', () => {
  it('renders Button variants correctly', () => {
    let tree: any;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <ThemeProvider>
          <Button variant="primary" title="Botón Primario" onPress={() => {}} />
          <Button variant="secondary" title="Botón Secundario" onPress={() => {}} />
          <Button variant="ghost" title="Botón Ghost" onPress={() => {}} />
          <Button variant="danger" title="Botón Danger" onPress={() => {}} />
        </ThemeProvider>
      ).toJSON();
    });

    expect(tree).toMatchSnapshot();
  });

  it('renders Badge states correctly', () => {
    let tree: any;
    ReactTestRenderer.act(() => {
      tree = ReactTestRenderer.create(
        <ThemeProvider>
          <Badge status="up" label="Activa" />
          <Badge status="down" label="Caída" />
          <Badge status="synced" label="Sincronizado" />
          <Badge status="pending" label="Pendiente" />
          <Badge status="failed" label="Error de envío" />
        </ThemeProvider>
      ).toJSON();
    });

    expect(tree).toMatchSnapshot();
  });
});
