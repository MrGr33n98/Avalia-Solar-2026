@echo off
cd AB0-1-back\app\models
del category.rb
copy category_fixed.rb category.rb
del category_fixed.rb
echo Category model fixed!
