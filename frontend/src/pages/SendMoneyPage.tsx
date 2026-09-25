import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { getApiErrorMessage } from '../services/apiError';
import { formatMoney } from '../services/format';
import { getWalletRequest } from '../features/wallet/walletApi';
import { lookupRecipientRequest, createTransferRequest } from '../features/transfers/transfersApi';
import { sendMoneyFormSchema, type SendMoneyFormValues } from '../features/transfers/schemas';
import type { Wallet } from '../features/wallet/types';
import type { Recipient } from '../features/transfers/types';
import type { TransactionDetail } from '../features/transactions/types';

type Step = 'recipient' | 'summary' | 'success';

export function SendMoneyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('recipient');
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [formValues, setFormValues] = useState<SendMoneyFormValues | null>(null);
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    getWalletRequest().then(setWallet);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SendMoneyFormValues>({ resolver: zodResolver(sendMoneyFormSchema) });

  async function onContinue(values: SendMoneyFormValues) {
    setRecipientError(null);
    try {
      const found = await lookupRecipientRequest(values.identifier);
      setRecipient(found);
      setFormValues(values);
      setStep('summary');
    } catch (err) {
      setRecipientError(getApiErrorMessage(err, 'Unable to find that recipient'));
    }
  }

  async function handleConfirm() {
    if (!formValues) return;
    setSummaryError(null);
    setIsConfirming(true);
    try {
      const result = await createTransferRequest(formValues);
      setTransaction(result.transaction);
      setStep('success');
    } catch (err) {
      setSummaryError(getApiErrorMessage(err, 'Unable to complete transfer'));
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="mx-auto max-w-md px-4 py-8">
        <h1 className="mb-6 text-xl font-semibold text-slate-800">Send Money</h1>

        {step === 'recipient' && (
          <Card>
            <form noValidate onSubmit={handleSubmit(onContinue)} className="flex flex-col gap-4">
              <Input
                label="Recipient (email or phone)"
                autoFocus
                error={errors.identifier?.message}
                {...register('identifier')}
              />
              <Input
                label="Amount (₹)"
                type="number"
                step="0.01"
                error={errors.amount?.message}
                {...register('amount', { valueAsNumber: true })}
              />
              <Input label="Note (optional)" error={errors.note?.message} {...register('note')} />
              {recipientError && <p className="text-sm text-red-600">{recipientError}</p>}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Looking up…' : 'Continue'}
              </Button>
            </form>
          </Card>
        )}

        {step === 'summary' && recipient && formValues && (
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Transfer Summary</h2>
            <dl className="flex flex-col gap-3 text-sm">
              <Row label="From" value={wallet ? wallet.walletNumber : '—'} />
              <Row label="To" value={`${recipient.name} (${recipient.identifier})`} />
              <Row label="Amount" value={formatMoney(formValues.amount.toFixed(2), wallet?.currency ?? 'INR')} />
              <Row label="Fee" value={formatMoney('0.00', wallet?.currency ?? 'INR')} />
              <Row label="Total" value={formatMoney(formValues.amount.toFixed(2), wallet?.currency ?? 'INR')} bold />
            </dl>
            {summaryError && <p className="mt-4 text-sm text-red-600">{summaryError}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setStep('recipient')} disabled={isConfirming}>
                Back
              </Button>
              <Button onClick={handleConfirm} disabled={isConfirming}>
                {isConfirming ? 'Processing…' : 'Confirm Transfer'}
              </Button>
            </div>
          </Card>
        )}

        {step === 'success' && transaction && formValues && (
          <Card>
            <p className="text-sm text-slate-600">
              {formatMoney(formValues.amount.toFixed(2), wallet?.currency ?? 'INR')} sent successfully.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Transaction ID:{' '}
              <Link to={`/transactions/${transaction.id}`} className="font-medium text-brand-600 hover:underline">
                {transaction.reference}
              </Link>
            </p>
            <Button className="mt-6" onClick={() => navigate('/')}>
              Done
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className="text-slate-500">{label}</dt>
      <dd className={bold ? 'font-semibold text-slate-900' : 'text-slate-800'}>{value}</dd>
    </div>
  );
}
