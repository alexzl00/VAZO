import { Tabs, Tab, Paper } from '@mui/material';

interface CardTabProps {
  value: number,
  labels: string[],
  onChange: (value: number) => void;
}

export default function CardTabs({ value, labels, onChange }: CardTabProps) {

  return (
    <Tabs
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      variant="standard"
      centered={false}
      sx={{
        '& .MuiTabs-indicator': { display: 'none' },
        '& .MuiTabs-flexContainer': {
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
          gap: 1
        }
      }}
    >
      {labels.map((label, i) => (
        <Tab
          key={label}
          disableRipple
          label={
            <Paper
              elevation={0}
              sx={{
                p: 1,
                width: '100%',
                height: '100%',
                textAlign: 'center',
                borderRadius: 2,
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                color: 'text.secondary',
                transition: 'none',
                borderBottom: '3px solid transparent',

                ...(value === i && {
                  color: 'red',
                  borderBottom: '3px solid red',
                  backgroundColor: 'rgba(255,0,0,0.08)'
                })
              }}
            >
              {label}
            </Paper>
          }
        />
      ))}
    </Tabs>
  );
}
