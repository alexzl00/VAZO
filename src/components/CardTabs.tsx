import { Tabs, Tab, Box } from '@mui/material';

interface CardTabProps {
  value: number,
  labels: string[],
  onChange: (value: number) => void;
  disabledTabs: number[]
}

export default function CardTabs({ value, labels, onChange, disabledTabs }: CardTabProps) {
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
          gridTemplateColumns: { md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 1,
        },
      }}
    >
      {labels.map((label, i) => {
        const selected = value === i;

        const disabled = disabledTabs.includes(i);
        return (
          <Tab
            key={label}
            disableRipple
            disabled={disabled}
            sx={{ padding: 0, minHeight: 0 }}
            label={
              <Box
                sx={{
                  position: "relative",
                  py: 1.2,
                  width: "100%",
                  minHeight: 46,

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  color: disabled ? "#fa4b1a" : "#3B4DB3",

                  transition: "color .2s ease, font-weight .2s ease",

                  /* hover only changes tone */
                  "&:hover": {
                    color: "#3B4DB3",
                  },

                  /* underline animation */
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    left: "15%",
                    bottom: 0,
                    width: "70%",
                    height: 3,
                    borderRadius: 3,
                    backgroundColor: "#23326D",

                    transformOrigin: "center",
                    transform: selected ? "scaleX(1)" : "scaleX(0)",
                    transition: "transform .28s cubic-bezier(.4,0,.2,1)",
                    willChange: "transform",
                  },
                }}
              >
                {label}
              </Box>
            }
          />
        );
      })}
    </Tabs>
  );
}


