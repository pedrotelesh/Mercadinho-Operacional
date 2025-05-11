 import { render, screen, fireEvent } from '@testing-library/react';
import RegisterPage from '../register/page';

describe('RegisterPage', () => {
  it('renderiza o formulário de registro', () => {
    render(<RegisterPage />);
    expect(screen.getByText('Criar Conta')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nome')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('E-mail')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrar/i })).toBeInTheDocument();
  });

  it('mostra erro se o registro falhar', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'E-mail já cadastrado' }) })) as any;
    render(<RegisterPage />);
    fireEvent.change(screen.getByPlaceholderText('Nome'), { target: { value: 'Teste' } });
    fireEvent.change(screen.getByPlaceholderText('E-mail'), { target: { value: 'teste@email.com' } });
    fireEvent.change(screen.getByPlaceholderText('Senha'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /registrar/i }));
    expect(await screen.findByText('E-mail já cadastrado')).toBeInTheDocument();
  });
});
