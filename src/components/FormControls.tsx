import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";
import { colors } from "../utils/statusColors";

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: colors.text, fontWeight: "700" }} selectable>
        {label}
      </Text>
      <TextInput
        placeholderTextColor="#8a9aa3"
        {...props}
        style={[
          {
            minHeight: 46,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            paddingHorizontal: 12,
            color: colors.text,
          },
          props.style,
        ]}
      />
    </View>
  );
}

type SelectFieldProps<T extends string> = {
  label: string;
  value: T;
  options: T[];
  onChange: (value: T) => void;
  format?: (value: T) => string;
};

export function SelectField<T extends string>({ label, value, options, onChange, format }: SelectFieldProps<T>) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.text, fontWeight: "700" }} selectable>
        {label}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((option) => {
          const selected = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              style={{
                borderRadius: 999,
                borderWidth: 1,
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? "#dff3ef" : colors.surface,
                paddingHorizontal: 12,
                paddingVertical: 9,
              }}
            >
              <Text style={{ color: selected ? colors.primaryDark : colors.text, fontWeight: "700" }} selectable>
                {format ? format(option) : option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
