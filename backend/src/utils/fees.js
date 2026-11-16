const round = (n) => Math.round(n * 100) / 100;

// Patient pays: doctor fee + admin commission (percent of the doctor fee)
exports.calcFees = (fee, percent) => {
  const doctorFee = Number(fee);
  const commissionPercent = Number(percent);
  const commissionAmount = round((doctorFee * commissionPercent) / 100);
  return { doctorFee, commissionPercent, commissionAmount, totalFee: round(doctorFee + commissionAmount) };
};
